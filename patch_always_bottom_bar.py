path = "app/globals.css"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    (
        """@media (max-width: 720px) {
.nav-logo {
position: absolute;
left: 50%;
transform: translateX(-50%);
}

.nav-links {
position: fixed;
left: 50%;
transform: translateX(-50%);
bottom: calc(28px + env(safe-area-inset-bottom));
background: linear-gradient(135deg, rgba(30,28,42,0.4), rgba(20,18,31,0.4));
backdrop-filter: blur(14px);
border: 0.5px solid rgba(245, 243, 255, 0.1);
border-radius: 999px;
box-shadow: 0 8px 28px rgba(0,0,0,0.5);
padding: 10px 8px;
justify-content: center;
 gap: 24px;
 width: fit-content;
overflow-x: visible;
z-index: 60;
}

body {
padding-bottom: calc(80px + env(safe-area-inset-bottom));
}
}""",
        """.nav-logo {
position: absolute;
left: 50%;
transform: translateX(-50%);
}

.nav-links {
position: fixed;
left: 50%;
transform: translateX(-50%);
bottom: calc(28px + env(safe-area-inset-bottom));
background: linear-gradient(135deg, rgba(30,28,42,0.4), rgba(20,18,31,0.4));
backdrop-filter: blur(14px);
border: 0.5px solid rgba(245, 243, 255, 0.1);
border-radius: 999px;
box-shadow: 0 8px 28px rgba(0,0,0,0.5);
padding: 10px 8px;
justify-content: center;
 gap: 24px;
 width: fit-content;
overflow-x: visible;
z-index: 60;
}

body {
padding-bottom: calc(80px + env(safe-area-inset-bottom));
}""",
    ),
    (
        """@media (max-width: 720px) {
.nav {
backdrop-filter: none;
}
}""",
        """.nav {
backdrop-filter: none;
}""",
    ),
    (
        """@media (max-width: 720px) {
.nav-links {
gap: 14px;
}
.nav-icon {
width: 27px;
height: 27px;
}
.nav-link {
padding: 8px 8px;
}
}""",
        """.nav-links {
gap: 14px;
}
.nav-icon {
width: 27px;
height: 27px;
}
.nav-link {
padding: 8px 8px;
}""",
    ),
]

missing = []
for old, new in replacements:
    if old not in content:
        missing.append(old[:50])
    else:
        content = content.replace(old, new, 1)

if missing:
    print("NOT FOUND for these blocks (skipped):", missing)
else:
    print("All three blocks matched and unwrapped")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("File written")
