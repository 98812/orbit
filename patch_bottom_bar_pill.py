path = "app/globals.css"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """.nav-links {
position: fixed;
left: 0;
right: 0;
bottom: 0;
background: rgba(20, 18, 31, 0.97);
backdrop-filter: blur(10px);
border-top: 1px solid rgba(245, 243, 255, 0.08);
border-radius: 0;
box-shadow: none;
padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
justify-content: space-around;
overflow-x: visible;
z-index: 60;
}

body {
padding-bottom: calc(64px + env(safe-area-inset-bottom));
}"""

new = """.nav-links {
position: fixed;
left: 16px;
right: 16px;
bottom: calc(16px + env(safe-area-inset-bottom));
background: linear-gradient(135deg, rgba(30,28,42,0.97), rgba(20,18,31,0.97));
backdrop-filter: blur(14px);
border: 0.5px solid rgba(245, 243, 255, 0.1);
border-radius: 999px;
box-shadow: 0 8px 28px rgba(0,0,0,0.5);
padding: 10px 8px;
justify-content: space-around;
overflow-x: visible;
z-index: 60;
}

body {
padding-bottom: calc(80px + env(safe-area-inset-bottom));
}"""

if old not in content:
    print("NOT FOUND - no changes made")
else:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
