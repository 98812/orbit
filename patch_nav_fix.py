path = "app/globals.css"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """   .nav {
     position: relative;
   }

   .nav-links {
     position: absolute;
     left: 50%;
     transform: translateX(-50%);
   }"""

new = """.nav {
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

if old not in content:
    print("NOT FOUND - no changes made")
else:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
