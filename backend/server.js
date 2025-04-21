const express = require('express');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const app = express();
const PORT = 5000;

// Setup storage for uploaded images
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, uniqueSuffix);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(__dirname + '/uploads'));

const postsFile = 'posts.json';

// Utility: Read posts
const readPosts = () => {
  if (!fs.existsSync(postsFile)) fs.writeFileSync(postsFile, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(postsFile));
};

// Utility: Write posts
const writePosts = (data) => fs.writeFileSync(postsFile, JSON.stringify(data));

// Get all posts
app.get('/posts', (req, res) => {
  res.json(readPosts());
});

// Create new post
app.post('/posts', upload.single('image'), (req, res) => {
  const posts = readPosts();
  const newPost = {
    id: Date.now(),
    title: req.body.title,
    body: req.body.body,
    image: req.file ? `/uploads/${req.file.filename}` : null
  };
  posts.unshift(newPost);
  writePosts(posts);
  res.json(newPost);
});

// Update post
app.put('/posts/:id', upload.single('image'), (req, res) => {
  const posts = readPosts();
  const index = posts.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).send('Post not found');

  posts[index].title = req.body.title;
  posts[index].body = req.body.body;

  if (req.file) {
    posts[index].image = `/uploads/${req.file.filename}`;
  }

  writePosts(posts);
  res.json(posts[index]);
});

// Delete post
app.delete('/posts/:id', (req, res) => {
  let posts = readPosts();
  posts = posts.filter(p => p.id != req.params.id);
  writePosts(posts);
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
