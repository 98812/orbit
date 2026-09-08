path = "app/globals.css"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}
"""

if old not in content:
    print("NOT FOUND - no changes made")
else:
    content = content.replace(old, "\n", 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
