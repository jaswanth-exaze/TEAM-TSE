// TSE Learning Hub — Team directory
//
// Each member owns a real HTML/CSS page at team/members/<slug>/index.html
// — that page IS their profile, built entirely by them. This script only
// builds the lightweight directory grid on team.html: it reads
// team/members/index.json for the list of slugs, then fetches each
// member's own page and pulls four <meta name="tse:*"> tags out of its
// <head> to render a card that links through to the real thing.

const MEMBERS_DIR = "team/members/";
const MEMBERS_INDEX = MEMBERS_DIR + "index.json";

document.addEventListener("DOMContentLoaded", loadTeam);

async function loadTeam() {
  const grid = document.querySelector("[data-team-grid]");
  const empty = document.querySelector("[data-team-empty]");
  const count = document.querySelector("[data-team-count]");
  if (!grid) return;

  let slugs = [];
  try {
    const res = await fetch(MEMBERS_INDEX, { cache: "no-store" });
    if (res.ok) slugs = await res.json();
  } catch (err) {
    console.warn("Could not load team/members/index.json", err);
  }

  if (!Array.isArray(slugs) || slugs.length === 0) {
    showEmptyState(grid, empty, count);
    return;
  }

  const members = await Promise.all(slugs.map(fetchMember));
  const valid = members.filter(Boolean);

  if (valid.length === 0) {
    showEmptyState(grid, empty, count);
    return;
  }

  if (count) {
    count.textContent = `${valid.length} member${valid.length === 1 ? "" : "s"}`;
  }
  grid.hidden = false;
  grid.innerHTML = valid.map(renderCard).join("");
}

async function fetchMember(slug) {
  const url = `${MEMBERS_DIR}${slug}/index.html`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const meta = (name) => doc.querySelector(`meta[name="tse:${name}"]`)?.content?.trim() || "";

    const name = meta("name");
    if (!name) return null; // template left un-filled — skip rather than show a blank card

    return {
      slug,
      url,
      name,
      role: meta("role") || "Trainee Software Engineer",
      tagline: meta("tagline"),
      github: meta("github"),
    };
  } catch (err) {
    console.warn(`Could not load member page for "${slug}"`, err);
    return null;
  }
}

function showEmptyState(grid, empty, count) {
  grid.hidden = true;
  if (empty) empty.hidden = false;
  if (count) count.textContent = "0 members";
}

function renderCard(member) {
  const initials = member.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return `
    <article class="profile-card">
      <div class="profile-photo">${initials}</div>
      <h3>${escapeHtml(member.name)}</h3>
      <p class="profile-role mono">${escapeHtml(member.role)}</p>
      <p class="profile-bio">${escapeHtml(member.tagline)}</p>
      <a class="profile-link" href="${escapeAttr(member.url)}">
        <span class="mono">View profile →</span>
      </a>
    </article>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function escapeAttr(str) {
  return escapeHtml(str);
}
