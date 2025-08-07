const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get('/', function (req, res) {
  fs.readdir('./files', function (err, files) {
    if (err) return res.status(500).send("Could not read files");

    if (files.length === 0) {
      return res.render('index', { tasks: [] });
    }

    let tasks = [];
    let filesProcessed = 0;

    files.forEach(filename => {
      fs.readFile(`./files/${filename}`, 'utf-8', function (err, content) {
        filesProcessed++;
        if (!err) {
          tasks.push({ filename, content });
        }
        if (filesProcessed === files.length) {
          // Optional: sort by filename
          tasks.sort((a, b) => a.filename.localeCompare(b.filename));
          res.render('index', { tasks });
        }
      });
    });
  });
});

app.get('/file/:filename', function (req, res) {
  fs.readFile(`./files/${req.params.filename}`, "utf-8", function (err, filedata) {
    if (err) return res.status(404).send("File not found");
    res.render('show', { filename: req.params.filename, filedata: filedata });
  });
});

app.get('/edit/:filename', function (req, res) {
  fs.readFile(`./files/${req.params.filename}`, "utf-8", function (err, filedata) {
    if (err) return res.status(404).send("File not found");
    res.render('edit', {
      filename: req.params.filename,
      filedata: filedata
    });
  });
});

app.post('/edit', function (req, res) {
  const oldPath = `./files/${req.body.prev}`;
  const newPath = `./files/${req.body.new}`;
  const updatedContent = req.body.description;

  if (req.body.prev !== req.body.new) {
    fs.rename(oldPath, newPath, function (err) {
      if (err) {
        console.error("Rename error:", err);
        return res.status(500).send("Rename error");
      }
      fs.writeFile(newPath, updatedContent, function (err) {
        if (err) {
          console.error("Write error:", err);
          return res.status(500).send("Write error");
        }
        res.redirect('/');
      });
    });
  } else {
    fs.writeFile(oldPath, updatedContent, function (err) {
      if (err) {
        console.error("Write error:", err);
        return res.status(500).send("Write error");
      }
      res.redirect('/');
    });
  }
});

app.post('/delete/:filename', function (req, res) {
  fs.unlink(`./files/${req.params.filename}`, function (err) {
    if (err) {
      console.error(err);
    }
    res.redirect('/');
  });
});

app.post('/create', function (req, res) {
  const filename = req.body.title.split(' ').join('');
  fs.writeFile(`./files/${filename}`, req.body.description, function (err) {
    if (err) {
      console.error(err);
    }
    res.redirect('/');
  });
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
