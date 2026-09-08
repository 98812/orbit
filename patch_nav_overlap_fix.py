path = "app/globals.css"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
}

.nav-links {
  justify-self: center;
}"""

new = """.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
}

.nav-logo {
  flex: 0 0 auto;
}

.nav-right {
  flex: 0 0 auto;
}

.nav-links {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  min-width: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.nav-links::-webkit-scrollbar {
  display: none;
}"""

if old not in content:
    print("NOT FOUND - no changes made")
else:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
