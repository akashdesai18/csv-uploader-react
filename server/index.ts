import express from 'express';
import { PaymanClient } from '@paymanai/payman-ts';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.post('/api/oauth/token', async (req, res) => {
  try {
    const { code } = req.body;
    const client = PaymanClient.withAuthCode(
      {
        clientId: process.env.VITE_PAYMAN_CLIENT_ID!,
        clientSecret: process.env.VITE_PAYMAN_CLIENT_SECRET!,
      },
      code
    );

    const tokenResponse = await client.getAccessToken();

    res.json({
      accessToken: tokenResponse.accessToken,
      expiresIn: tokenResponse.expiresIn,
    });
  } catch (error) {
    console.error('Token exchange failed:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 