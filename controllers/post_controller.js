import { CommentModel } from "../models/comment.js"
import { PostModel } from "../models/post.js"
import { MemberModel } from "../models/member.js"

// Retrieve all Posts
const getAllPosts = async (req, res) => {
    try {
        // Find all posts, sort by latest and populate author and comments fields
        // with relevant data from Member and Comment documents
        const allPosts = await PostModel
            .find().sort({ date_posted: 'desc' })
            .populate({ path: 'author', select: 'username' })
            .populate({ path: 'comments', populate: {
                path: 'author', select: 'username'
            }})
        // Return all the posts
        return res.status(200).send(allPosts)
    } catch (err) {
        return res.status(500).send({ error: err.message })
    }
}

// Retrieve one Post using id
const getPost = async (req, res) => {
    try {
        // Find one post with id, sort by latest and populate author and comments fields
        // with relevant data from Member and Comment documents
        const post = await PostModel
            .findById(req.params.id)
            .populate({ path: 'author', select: 'username' })
            .populate({ path: 'comments', populate: {
                path: 'author', select: 'username'
            }})
        // If a post with the id is found, return it
        if (post) {
            return res.status(201).send(post)
        } 
        // If no post with that id is found, return error message post not found
        else {
            return res.status(404).send({ error: `Post with id: ${req.params.id} not found` })
        }
    } catch (err) {
       return  res.status(500).send({ error: err.message })
    }
}

// Retrieve all Posts matching a category
const getCategory = async (req, res) => {
    try {
        // Find all posts that match category param, sort by latest and populate author 
        // and comments fields with relevant data from Member and Comment documents
        const posts = await PostModel
            .find({ category: req.params.category })
            .sort({ date_posted: 'desc' })
            .populate({ path: 'author', select: 'username' })
            .populate({ path: 'comments', populate: {
                path: 'author', select: 'username'
            }})
        // If any posts are found, return them
        if (posts) {
            res.status(200).send(posts)
        } 
        // If no posts in that category are found, return error message posts in category not found
        else {
            return res.status(404).send({ error: `Posts in category: ${req.params.category} not found` })
        }
    } catch (err) {
        res.status(500).send({ error: err.message })
    }
}

// Create new Post in DB
const createPost = async (req, res) => {
    try {
        // Destructure request body to get title, author, category and content
        const { title, category, content  } = req.body
        // Create new Post with title, author, category and content
        const insertPost = await PostModel.create({ 
            title: title, 
            author: req.member.id,
            category: category, 
            content: content
        })
        // If a post is successfully created, return it and populate the author field with username
            return res.status(201).send(await insertPost
                .populate({ path: 'author', select: 'username' }))
    } catch (err) {
        return res.status(500).send({ error: err.message })
    }
}

// Update an existing post in the DB
const updatePost = async (req, res) => {
    try {
        // Destructure request body to get title, category and content
        const { title, category, content  } = req.body
        // Create an object with title category and content
        const updatedPost = { title, category, content }
        // Find a Post matching the id param then update its fields matching the
        // fields in the updatedPost object
        const post = await PostModel
        .findByIdAndUpdate(req.params.id, updatedPost, 
            { returnDocument: 'after' })
            .populate({ path: 'author', select: 'username' })
            .populate({ path: 'comments', populate: {
                path: 'author', select: 'username'}}) 
        return res.status(200).send(post)
    } catch (err) {
        res.status(500).send({ error: err.message })
    }
}

// Delete an existing post from the DB
const deletePost = async (req, res) => {
    try {
        // If a post with id matching the param id is found, delete it
        const post = await PostModel.findByIdAndDelete(req.params.id)
        // Delete any Comments with id matching an id in the array of ids in the 
        // Post's comment field
        await CommentModel.deleteMany({_id: {$in: post.comments}})
        // If the post was deleted, sent 204 status as success
        if (post) {
            res.status(204).send({message: 'Post deleted successfully'})
        }
    }
    catch (err) {
        res.status(500).send({ error: err.message })
    }
}

// Rate a post 1-5 stars
const ratePost = async (req, res) => {
    try {
        // Destructure the users rating form request
        const { userRating } = req.body
        // Lookup Post passed in params and add the user rating to its 'rating' array
        // Then return the updated post
        const post = await PostModel
        .findByIdAndUpdate(req.params.id, {"$push": {rating: userRating}}, { returnDocument: 'after' })
        .populate({ path: 'author', select: 'username' })
        .populate({ path: 'comments', populate: {
            path: 'author', select: 'username'}}) 
        // FInd the member by id from JWT token in request and add the post id they rated so 
        // they cannot rate the post multiple times
        await MemberModel.findByIdAndUpdate(req.member.id, {"$push": {has_rated: post._id}})

        return res.status(200).send(post)
    }
    catch (err) {
        res.status(500).send({ error: err.message })
    }
}

export { getAllPosts, getPost, getCategory, createPost, updatePost, deletePost, ratePost }
