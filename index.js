const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const users = [];

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));

function isAuthenticated(req, res, next) {
  if (req.session.user) next();
  else res.redirect('/login');
}

// -------- Auth Routes --------

app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (users.find(user => user.username === username)) {
    return res.render('signup', { error: 'User already exists' });
  }
  users.push({ username, password });

  // Create user folder
  const userDir = path.join(__dirname, 'files', username);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  req.session.user = username;
  res.redirect('/');
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.render('login', { error: 'Invalid credentials' });
  req.session.user = username;
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// -------- File Routes (User-specific) --------

app.get('/', isAuthenticated, (req, res) => {
  const userDir = path.join(__dirname, 'files', req.session.user);
  fs.readdir(userDir, (err, files) => {
    if (err || files.length === 0) {
      return res.render('index', { tasks: [], user: req.session.user });
    }

    let tasks = [];
    let filesProcessed = 0;

    files.forEach(filename => {
      fs.readFile(path.join(userDir, filename), 'utf-8', (err, content) => {
        filesProcessed++;
        if (!err) {
          tasks.push({ filename, content });
        }
        if (filesProcessed === files.length) {
          tasks.sort((a, b) => a.filename.localeCompare(b.filename));
          res.render('index', { tasks, user: req.session.user });
        }
      });
    });
  });
});

app.get('/file/:filename', isAuthenticated, (req, res) => {
  const filepath = path.join(__dirname, 'files', req.session.user, req.params.filename);
  fs.readFile(filepath, "utf-8", (err, filedata) => {
    if (err) return res.status(404).send("File not found");
    res.render('show', { filename: req.params.filename, filedata });
  });
});

app.get('/edit/:filename', isAuthenticated, (req, res) => {
  const filepath = path.join(__dirname, 'files', req.session.user, req.params.filename);
  fs.readFile(filepath, "utf-8", (err, filedata) => {
    if (err) return res.status(404).send("File not found");
    res.render('edit', { filename: req.params.filename, filedata });
  });
});

app.post('/edit', isAuthenticated, (req, res) => {
  const userDir = path.join(__dirname, 'files', req.session.user);
  const oldPath = path.join(userDir, req.body.prev);
  const newPath = path.join(userDir, req.body.new);
  const updatedContent = req.body.description;

  if (req.body.prev !== req.body.new) {
    fs.rename(oldPath, newPath, err => {
      if (err) return res.status(500).send("Rename error");
      fs.writeFile(newPath, updatedContent, err => {
        if (err) return res.status(500).send("Write error");
        res.redirect('/');
      });
    });
  } else {
    fs.writeFile(oldPath, updatedContent, err => {
      if (err) return res.status(500).send("Write error");
      res.redirect('/');
    });
  }
});

app.post('/delete/:filename', isAuthenticated, (req, res) => {
  const filepath = path.join(__dirname, 'files', req.session.user, req.params.filename);
  fs.unlink(filepath, err => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

app.post('/create', isAuthenticated, (req, res) => {
  const filename = req.body.title.split(' ').join('');
  const filepath = path.join(__dirname, 'files', req.session.user, filename);
  fs.writeFile(filepath, req.body.description, err => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

// -------- Start Server --------

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
