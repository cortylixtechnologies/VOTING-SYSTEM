import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { studentId, email, password } = req.body;
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ student_id: studentId, email, password, role: 'student' }])
        .select()
        .single();
      
      if (error) throw error;
      res.json({ id: data.id, studentId: data.student_id, email: data.email, role: data.role });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { identifier, password } = req.body;
    console.log(`Login attempt for: ${identifier}`);
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('password', password)
        .or(`student_id.eq.${identifier},email.eq.${identifier}`)
        .maybeSingle();

      if (error) {
        console.error("Supabase error during login:", error);
        throw error;
      }

      if (!user) {
        console.warn(`Login failed: No user found for ${identifier}`);
        throw new Error("Invalid credentials");
      }

      console.log(`Login successful for: ${user.student_id}`);
      res.json({ id: user.id, studentId: user.student_id, email: user.email, role: user.role });
    } catch (err: any) {
      console.error("Login route error:", err.message);
      res.status(401).json({ error: err.message });
    }
  });

  // Election Routes
  app.get("/api/elections", async (req, res) => {
    const { data: elections, error } = await supabase
      .from('elections')
      .select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(elections);
  });

  app.get("/api/elections/:id", async (req, res) => {
    try {
      const { data: election, error: eError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', req.params.id)
        .single();
      
      if (eError || !election) throw new Error("Election not found");

      const { data: positions, error: pError } = await supabase
        .from('positions')
        .select('*, candidates(*)')
        .eq('election_id', req.params.id);

      if (pError) throw pError;
      
      election.positions = positions;
      res.json(election);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  app.post("/api/elections", async (req, res) => {
    const { title, description, startDate, endDate } = req.body;
    const { data, error } = await supabase
      .from('elections')
      .insert([{ title, description, start_date: startDate, end_date: endDate }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.post("/api/elections/:id/positions", async (req, res) => {
    const { title } = req.body;
    const { data, error } = await supabase
      .from('positions')
      .insert([{ election_id: req.params.id, title }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  app.post("/api/positions/:id/candidates", async (req, res) => {
    const { name, bio, imageUrl } = req.body;
    const { data, error } = await supabase
      .from('candidates')
      .insert([{ position_id: req.params.id, name, bio, image_url: imageUrl }])
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ id: data.id });
  });

  // Voting Routes
  app.post("/api/vote", async (req, res) => {
    const { userId, electionId, positionId, candidateId } = req.body;
    try {
      const { error } = await supabase
        .from('votes')
        .insert([{ user_id: userId, election_id: electionId, position_id: positionId, candidate_id: candidateId }]);
      
      if (error) {
        if (error.code === '23505') throw new Error("You have already voted for this position.");
        throw error;
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/user/:userId/votes/:electionId", async (req, res) => {
    const { data: votes, error } = await supabase
      .from('votes')
      .select('position_id')
      .eq('user_id', req.params.userId)
      .eq('election_id', req.params.electionId);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(votes.map((v: any) => v.position_id));
  });

  // Results Routes
  app.get("/api/elections/:id/results", async (req, res) => {
    try {
      // Supabase doesn't support complex joins/aggregations as easily as raw SQL in a single call without RPC
      // We'll fetch positions and candidates and then count votes
      const { data: positions, error: pError } = await supabase
        .from('positions')
        .select('id, title')
        .eq('election_id', req.params.id);
      
      if (pError) throw pError;

      const results = [];
      for (const pos of positions) {
        const { data: candidates, error: cError } = await supabase
          .from('candidates')
          .select('id, name')
          .eq('position_id', pos.id);
        
        if (cError) throw cError;

        for (const cand of candidates) {
          const { count, error: vError } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('candidate_id', cand.id);
          
          if (vError) throw vError;

          results.push({
            position: pos.title,
            candidate: cand.name,
            votes: count || 0
          });
        }
      }
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
