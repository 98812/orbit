path = "app/globals.css"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """@media (max-width: 720px) {
.nav-links {
gap: 24px;
}
.nav-icon {
width: 21px;
height: 21px;
}
.nav-link {
padding: 8px 8px;
}
}"""

new = """@media (max-width: 720px) {
.nav-links {
gap: 8px;
}
.nav-icon {
width: 20px;
height: 20px;
}
.nav-link {
padding: 6px 6px;
}
}"""

if old not in content:
    print("NOT FOUND - no changes made")
else:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched successfully")
