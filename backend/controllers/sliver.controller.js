const Sliver = require('../models/sliver.model');

exports.createSliver = async (req, res) => {
    try {
        const { text } = req.body;
        const sliver = new Sliver({ text });
        await sliver.save();
        res.status(201).json(sliver);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllSlivers = async (req, res) => {
    try {
        const slivers = await Sliver.find().sort({ createdAt: -1 });
        res.json(slivers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSliver = async (req, res) => {
    try {
        const { id } = req.params;
        const sliver = await Sliver.findByIdAndDelete(id);
        if (!sliver) {
            return res.status(404).json({ message: 'Sliver not found' });
        }
        res.json({ message: 'Sliver deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
