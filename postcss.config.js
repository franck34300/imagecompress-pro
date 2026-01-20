module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Commit** → "Add PostCSS config"

---

## 📝 **Fichier 2/2 : `.gitignore`**
```
https://github.com/franck34300/imagecompress-pro/new/main?filename=.gitignore
```

**Collez ce code :**
```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
