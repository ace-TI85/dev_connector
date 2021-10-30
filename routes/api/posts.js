const { response } = require('express');
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

/**
 * @route       POST api/posts
 * @description Create a post
 * @access      Private
 */
router.post('/', [ auth, [
  check('text', 'Text is required')
    .not()
    .isEmpty()
  ]], 
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).send({ errors: errors.array() })
    }

    try {
      const user = await User.findById(request.user.id).select('-password');

      const newPost = new Post({
        text: request.body.text,
        name: user.name,
        avatar: user.avatar,
        user: request.user.id
      });

      const post = await newPost.save();

      response.json(post);
    } catch (error) {
      console.log(error.message);
      response.status(500).send({ msg: 'Server Error' });
    }
});

/**
 * @route       GET api/posts
 * @description Get all posts
 * @access      Private
 */

router.get('/', auth, async (request, response) => {
  try {
    // sort by date: -1 indicates most recent first; opposite is 1
    const posts = await Post.find().sort({ date: -1 })
    response.json(posts);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ msg: 'Server Error' });
   }
});

/**
 * @route       GET api/posts
 * @description Get post by id
 * @access      Private
 */

 router.get('/:id', auth, async (request, response) => {
  try {
  
    const post = await Post.findById(request.params.id);

    if (!post) {
      return response.status(404).json({ msg: `No post by id: ${request.params.id}` });
    }

    response.json(post);
  } catch (error) {
    console.log(error.message);
    if (error.kind === 'ObjectId') {
      return response.status(404).json({ msg: `No post by id: ${request.params.id}` });
    }
    response.status(500).send({ msg: 'Server Error' });
   }
});

/**
 * @route       DELETE api/posts
 * @description Delete a post
 * @access      Private
 */

 router.delete('/:id', auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);

    // check if post exists
    if (!post) {
      return response.status(404).json({ msg: `No post by id: ${request.params.id}` });
    }

    // check user
    if (post.user.toString() !== request.user.id) {
      return response.status(401).json({ msg: "User not authorised" })
    }

    await post.remove();

    response.json({ msg: "Post removed" });
  } catch (error) {
    console.log(error.message);
    if (error.kind === 'ObjectId') {
      return response.status(404).json({ msg: `No post by id: ${request.params.id}` });
    }
    response.status(500).send({ msg: 'Server Error' });
   }
});

/**
 * @route       PUT api/posts/like/:id
 * @description Like a post
 * @access      Private
 */

router.put('/like/:id', auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);

    // check if post is already liked
    if (post.likes.filter(like => like.user.toString() === request.user.id).length > 0){
      return response.status(400).json({ msg: 'Post already liked' })
    }

    post.likes.unshift({ user: request.user.id })
    await post.save();
    response.json(post.likes);

  } catch (error) {
    console.log(error.message);
    response.status(500).send('Server Error');
  }
});

/**
 * @route       PUT api/posts/unlike/:id
 * @description Unlike a post
 * @access      Private
 */

 router.put('/unlike/:id', auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);

    // check if post is already unliked
    if (post.likes.filter(like => like.user.toString() === request.user.id).length === 0){
      return response.status(400).json({ msg: 'Post has not yet been liked.' })
    }

    // get remove index
    const removeIndex = post.likes.map(like => like.user.toString()).indexOf(request.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();
    response.json(post.likes);

  } catch (error) {
    console.log(error.message);
    response.status(500).send('Server Error');
  }
});

/**
 * @route       POST api/posts/comment
 * @description Create a comment on a post
 * @access      Private
 */
 router.post('/comment/:id', [ auth, [
  check('text', 'Text is required')
    .not()
    .isEmpty()
  ]], 
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).send({ errors: errors.array() })
    }

    try {
      const user = await User.findById(request.user.id).select('-password');
      const post = await Post.findById(request.params.id);

      const newComment = {
        text: request.body.text,
        name: user.name,
        avatar: user.avatar,
        user: request.user.id
      };

      post.comments.unshift(newComment)

      await post.save();

      response.json(post.comments);
    } catch (error) {
      console.log(error.message);
      response.status(500).send({ msg: 'Server Error' });
    }
});

/**
 * @route       DELETE api/posts/comment/:id/:comment_id
 * @description Delete a comment on a post
 * @access      Private
 */

router.delete('/comment/:id/:comment_id', auth, async (request, response) => {
  try {
    const post = await Post.findById(request.params.id);

    // get comment from post
    const comment = post.comments.find(comment => comment.id === request.params.comment_id)

    if (!comment) {
      return response.status(404).json({ msg: "Comment not found." });
    }

    // check user
    if (comment.user.toString() !== request.user.id) {
      return response.status(401).json({ msg: "User not authorised." });
    }

    // get remove index
    const removeIndex = post.comments
                          .map(comment => comment.user.toString())
                          .indexOf(request.user.id);

    post.comments.splice(removeIndex, 1);
    await post.save();

    response.json(post.comments);

  } catch (error) {
    console.log(error.message);
    response.status(500).json({ msg: "Server Error." })
  }
})

module.exports = router;