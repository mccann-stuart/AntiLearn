import re

css_file_path = "public/style.css"
with open(css_file_path, "r") as f:
    content = f.read()

pattern = r"""(\.day\[role="button"\]:hover\s*\{\s*transform:\s*scale\(1\.15\);\s*z-index:\s*5;\s*box-shadow:\s*0\s*4px\s*12px\s*rgba\(0,\s*0,\s*0,\s*0\.3\);\s*position:\s*relative;)\s*transition:\s*transform\s*0\.2s\s*ease,\s*box-shadow\s*0\.2s\s*ease,\s*z-index\s*0s;\s*\}"""

replacement = r"""    .day[role="button"] {
        transition: transform 0.2s ease, box-shadow 0.2s ease, z-index 0s;
    }
    \1
    }"""

new_content = re.sub(pattern, replacement, content)

with open(css_file_path, "w") as f:
    f.write(new_content)
