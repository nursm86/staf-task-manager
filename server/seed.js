const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('./models/User');

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding...');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        const users = [
            {
                name: 'Nemo',
                password: process.env.USER_NEMO_PASSWORD,
                role: 'Admin',
            },
            {
                name: 'Nur',
                password: process.env.USER_NUR_PASSWORD,
                role: 'Admin',
            },
            {
                name: 'Lamim',
                password: process.env.USER_LAMIM_PASSWORD,
                role: 'User',
            },
            {
                name: 'Tony',
                password: process.env.USER_TONY_PASSWORD,
                role: 'User',
            },
        ];

        for (const userData of users) {
            const user = await User.create(userData);
            console.log(`Created user: ${user.name} (${user.role})`);
        }

        console.log('\nSeeding complete! Users created:');
        console.log('  Nemo  -> password: ' + process.env.USER_NEMO_PASSWORD);
        console.log('  Nur   -> password: ' + process.env.USER_NUR_PASSWORD);
        console.log('  Lamim -> password: ' + process.env.USER_LAMIM_PASSWORD);
        console.log('  Tony  -> password: ' + process.env.USER_TONY_PASSWORD);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedUsers();
