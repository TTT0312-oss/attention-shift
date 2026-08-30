import { env } from "cloudflare:workers";

export const runtime = "edge";

type ScoreInput = {
  name?: unknown;
  score?: unknown;
  cleared?: unknown;
  bestCombo?: unknown;
  mistakes?: unknown;
};

function cleanName(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 12)
    : "";
}

async function leaderboard() {
  const result = await env.DB.prepare(
    `SELECT player_name AS name, MAX(score) AS score,
      MAX(cleared) AS cleared, MAX(best_combo) AS bestCombo,
      MIN(mistakes) AS mistakes
     FROM scores
     GROUP BY player_name
     ORDER BY score DESC, created_at ASC
     LIMIT 20`,
  ).all();
  return result.results;
}

export async function GET() {
  return Response.json({ leaderboard: await leaderboard() });
}

export async function POST(request: Request) {
  let body: ScoreInput;
  try {
    body = (await request.json()) as ScoreInput;
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const name = cleanName(body.name);
  const score = Number(body.score);
  const cleared = Number(body.cleared);
  const bestCombo = Number(body.bestCombo);
  const mistakes = Number(body.mistakes);
  const values = [score, cleared, bestCombo, mistakes];
  if (!name || values.some((value) => !Number.isInteger(value) || value < 0) || score > 50000) {
    return Response.json({ error: "invalid_score" }, { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO scores (player_name, score, cleared, best_combo, mistakes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(name, score, cleared, bestCombo, mistakes, Date.now()).run();

  const rows = await leaderboard();
  const rank = rows.findIndex((row) => row.name === name) + 1;
  return Response.json({ leaderboard: rows, rank: rank || null });
}
