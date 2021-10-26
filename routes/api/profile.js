const express = require('express');
const npm_request = require('request');
const config = require('config');
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
  console.log(request.user.id);
  try {
    const profile = await Profile
                          .findOne({ user: request.user.id })
                          .populate('user', ['name', 'avatar']);

    if (!profile) {
      return response
              .status(400)
              .json({ msg: 'No profile for this user' });
    }

    return response.json(profile);
  } catch (error) {
    console.log(error.message);
    return response.status(500).send('Server error');
  }
});


/**
 * @route       POST api/profile
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
  profileFields.user = request.user.id;
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

/**
 * @route       GET api/profile
 * @description Get all profiles
 * @access      Public
 */

router.get('/', async (request, response) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    response.json(profiles);
  } catch (error) {
    console.log(error.message);
    response.status(500).send('Server Error');
  }
})

/**
 * @route       GET api/profile/user/:user_id
 * @description Get profile by user ID
 * @access      Public
 */

router.get('/user/:user_id', async (request, response) => {

  try {
    const profile = await Profile.findOne({ user: request.params.user_id })
                                 .populate('user', ['name', 'avatar']);
    
    if (!profile) {
      return response.status(400)
                     .json({ msg: `There is no profile for user with ID: ${request.params.user_id}` });
    }
    
    response.json(profile);
  } catch (error) {
    console.log(error.message);

    if (error.kind === 'ObjectId'){
      return response.status(400)
                     .json({ msg: `Not a valid user id` }); 
    }

    response.status(500).send('Server Error');
  }
})

/**
 * @route       DELETE api/profile/
 * @description Delete profile, user & posts
 * @access      Private
 */

 router.delete('/user/:user_id', auth, async (request, response) => {
  try {
    // @todo - remove user's posts

    // remove profile
    await Profile.findOneAndRemove({ user: request.user.id });

    // remove user
    await User.findOneAndRemove({ _id: request.user.id });
    
    response.json({
      msg: 'User deleted'
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send('Server Error');
  }
});

/**
 * @route       PUT api/profile/experience
 * @description Add experience to profile
 * @access      Private
 */

 router.put('/experience', [auth, [
  check('title', 'Title is required')
    .not()
    .isEmpty(),
    check('company', 'Company is required')
    .not()
    .isEmpty(),
    check('from', 'From Date is required')
    .not()
    .isEmpty()
 ]], async (request, response) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()){
    return response.status(400).json({ errors: errors.array() })
  }

  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  } = request.body;

  const newExperience = {
    title: title,
    company: company,
    location: location,
    from: from,
    to: to,
    current: current,
    description: description
  }

  try {
    const profile = await Profile.findOne({ user: request.user.id });
    profile.experience.unshift(newExperience);
    await profile.save();

    response.json(profile);
  } catch (error) {
    console.log(error.message);
    response.status(500).send('Internal server error')
  }
});

/**
 * @route       DELETE api/profile/experience/:exp_id
 * @description Delete experience from profile
 * @access      Private
 */

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });

    foundProfile.experience = foundProfile.experience.filter(
      (exp) => exp._id.toString() !== req.params.exp_id
    );

    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route       PUT api/profile/education
 * @description Add education to profile
 * @access      Private
 */

 router.put('/education', [auth, [
    check('school', 'School is required')
    .not()
    .isEmpty(),
    check('degree', 'Degree is required')
    .not()
    .isEmpty(),
    check('fieldofstudy', 'Field of study is required')
    .not()
    .isEmpty(),
    check('from', 'From Date is required')
    .not()
    .isEmpty()
  ]], async (request, response) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()){
    return response.status(400).json({ errors: errors.array() })
  }

  const {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  } = request.body;

  const newEducation = {
    school: school,
    degree: degree,
    fieldofstudy: fieldofstudy,
    from: from,
    to: to,
    current: current,
    description: description
  }

  try {
    const profile = await Profile.findOne({ user: request.user.id });
    profile.education.unshift(newEducation);
    await profile.save();

    response.json(profile);
  } catch (error) {
    console.log(error.message);
    response.status(500).send('Internal server error')
  }
});

/**
 * @route       DELETE api/profile/education/:edu_id
 * @description Delete education from profile
 * @access      Private
 */

 router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });
    foundProfile.education = foundProfile.education.filter(
      (edu) => edu._id.toString() !== req.params.edu_id
    );
    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Server error' });
  }
});

/**
 * @route       GET api/profile/github/:username
 * @description Get user repos from github
 * @access      Public
 */

router.get('/github/:username', async (request, response) => {
  
  try {
    const gitURL = `https://api.github.com/users/${request.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`;

    const options = {
      uri: gitURL,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    };

    npm_request(options, (error, res, body) => {
      if (error){
        console.log(error)
      }

      if (res.statusCode !== 200) {
        return response.status(404).json({ msg: 'No Github Profile Found' });
      }

      response.json(JSON.parse(body));
    })
  } catch (error) {
    console.log(error.message);
    response.status(500).send('Server Error')
  }
})

module.exports = router;