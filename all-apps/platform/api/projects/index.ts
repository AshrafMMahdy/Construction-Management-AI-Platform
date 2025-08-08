
import { projectsDB } from '../database';

// This function will be deployed as a Vercel Serverless Function.
// It uses the Node.js runtime.
export default function handler(req, res) {
  // Simulate network latency for a more realistic loading experience
  setTimeout(() => {
    if (req.method === 'GET') {
      // Set CORS headers to allow requests from any origin
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.status(200).json(projectsDB);
    } else if (req.method === 'OPTIONS') {
      // Pre-flight request
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
    } else {
      res.setHeader('Allow', ['GET', 'OPTIONS']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }, 500);
}
