const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator')
const Profile = require('../../models/Profile');
const User = require('../../models/User');

/**
 * @route       GET api/profile/me
 * @description Get current user's profile
 * @access      Private
 */
router.get('/me', auth, async (request, response) => {
  try {
    const profile = await Profile.findOne({ user: request.user.id }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return response.status(400).json({ msg: 'No profile for this user' });
    }

    response.json(profile);
  } catch (error) {
    console.log(error.message);
    response.status(500).send('Server error');
  }
});


/**
 * @route       GET api/profile
 * @description Create or update user profile
 * @access      Private
 */
router.post(
  '/', 
  [
    auth, [
      check('status', 'Status is required.')
        .not()
        .isEmpty(),
      check('skills', 'Skills are reqired.')
        .not()
        .isEmpty()
    ]
], 
async (request, response) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(400).json({ errors: errors.array() })
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
  } = request.body;

  // build profile object
  const profileFields = {}
  profileFields.user = request.body.id;
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;
  if (skills) {
    // trim any white space from csv user inputs before putting it into array
    profileFields.skills = skills.split(',').map(skill => skill.trim());
  }

  // build social object
  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube;
  if (instagram) profileFields.social.instagram = instagram;
  if (twitter) profileFields.social.twitter = twitter;
  if (linkedin) profileFields.social.linkedin = linkedin;
  if (facebook) profileFields.social.facebook = facebook;

  try {
    let profile = await Profile.findOne({ user: request.user.id })

    if (profile) {
      // update if already exists
      profile = await Profile.findOneAndUpdate(
        { user: request.user.id }, 
        { $set: profileFields },
        { new: true }
      );

      return response.status(200).json(profile);
    }

    // create profile if not found
    profile = new Profile(profileFields);

    await profile.save();
    return response.json(profile);

  } catch (error) {
    console.log(error);
    response.status(500).send({
      msg: "Server error"
    })
  }
  response.send('Hello');
});

module.exports = router;