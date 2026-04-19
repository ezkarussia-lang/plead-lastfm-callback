export const runtime = "nodejs";

import mongoose from "mongoose";

const CLIENT_ID = (process.env.SPOTIFY_CLIENT_ID || "").trim();
const CLIENT_SECRET = (process.env.SPOTIFY_CLIENT_SECRET || "").trim();
const MONGO_URI = (process.env.MONGO_URI || "").trim();
const DISCORD_TOKEN = (process.env.DISCORD_TOKEN || "").trim();
const REDIRECT_URI = "https://contoured.vercel.app/spotify/callback";

const spotifyAuthSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  accessToken: String,
  refreshToken: String,
  expiresAt: Number,
});

let _conn = null;
async function getConn() {
  if (_conn && _conn.readyState === 1) return _conn;
  _conn = await mongoose
    .createConnection(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    .asPromise();
  return _conn;
}

async function sendDM(discordId, spotifyUsername) {
  if (!DISCORD_TOKEN) return;
  try {
    const dm = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: discordId }),
    }).then((r) => r.json());

    await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [
          {
            color: 0x1db954,
            description: `✅ Your Spotify account **${spotifyUsername}** has been connected successfully! You can now use \`,spotify\` commands.`,
          },
        ],
      }),
    });
  } catch {}
}

function Card({ success, icon, heading, body, showTag, accentColor }) {
  const color = accentColor || (success ? "#b90000" : "#666");
  return (
    <div className="card">
      <span className="icon">{icon}</span>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "10px", color }}>{heading}</h1>
      <p dangerouslySetInnerHTML={{ __html: body }} />
      {showTag && (
        <div className="tag" style={{ background: accentColor || "#1db954" }}>
          ✓ spotify connected
        </div>
      )}
      <p className="footer">Contoured · Spotify integration</p>
    </div>
  );
}

export default async function SpotifyCallbackPage({ searchParams }) {
  const { code, state, error } = await searchParams;

  if (error || !code || !state) {
    return (
      <Card
        icon="❌"
        success={false}
        heading="Authorization Failed"
        body="Spotify authorization was denied or failed. Try again with <strong>,spotify login</strong>."
      />
    );
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return (
      <Card
        icon="❌"
        success={false}
        heading="Not Configured"
        body="Set <strong>SPOTIFY_CLIENT_ID</strong> and <strong>SPOTIFY_CLIENT_SECRET</strong> in your Vercel environment variables."
      />
    );
  }

  if (!MONGO_URI) {
    return (
      <Card
        icon="❌"
        success={false}
        heading="Not Configured"
        body="Set <strong>MONGO_URI</strong> in your Vercel environment variables."
      />
    );
  }

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      return (
        <Card
          icon="❌"
          success={false}
          heading="Token Exchange Failed"
          body="Failed to get Spotify token. Please try again with <strong>,spotify login</strong>."
        />
      );
    }

    const tokenData = await tokenRes.json();

    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    const spotifyUsername = profile.display_name || profile.id || "your account";

    const c = await getConn();
    const SpotifyAuth =
      c.models.SpotifyAuth || c.model("SpotifyAuth", spotifyAuthSchema);

    await SpotifyAuth.findOneAndUpdate(
      { userId: state },
      {
        userId: state,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + tokenData.expires_in * 1000,
      },
      { upsert: true, new: true }
    );

    sendDM(state, spotifyUsername).catch(() => {});

    return (
      <Card
        icon="🎵"
        success={true}
        heading={`Connected, ${spotifyUsername}!`}
        body="Your Spotify account has been linked.<br/>Check your Discord DMs — Contoured has sent you a confirmation.<br/><br/>You can close this tab."
        showTag={true}
        accentColor="#1db954"
      />
    );
  } catch (err) {
    return (
      <Card
        icon="❌"
        success={false}
        heading="Something went wrong"
        body={err.message || "Unknown error. Please try again."}
      />
    );
  }
}
