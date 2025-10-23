const Story = require('../models/story.model');

exports.createStory = async (req, res) => {
    try {
        const { title, content } = req.body;
        const story = new Story({ title, content });
        await story.save();
        res.status(201).json(story);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllStories = async (req, res) => {
    try {
        const stories = await Story.find().sort({ createdAt: -1 });
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await Story.findByIdAndDelete(id);
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }
        res.json({ message: 'Story deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};