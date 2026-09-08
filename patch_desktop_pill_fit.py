path = "app/globals.css"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """.nav-links {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  min-width: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}"""

new = """.nav-links {
  flex: 0 1 auto;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}"""

if old not in content:
    print("NOT FOUND - no changes made")
else:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
