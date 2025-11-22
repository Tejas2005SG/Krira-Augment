// Check if API key exists
import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const hashApiKey = (apiKey) => crypto.createHash("sha256").update(apiKey).digest("hex");

async function checkApiKey() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const rawKey = "sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432";
        const keyHash = hashApiKey(rawKey);

        console.log('\nSearching for API key...');

        const ApiKey = mongoose.model('ApiKey');
        const key = await ApiKey.findOne({ keyHash });

        if (!key) {
            console.log('\n❌ API key not found in database!');

            const allKeys = await ApiKey.find({});
            console.log('\nTotal API keys in database:', allKeys.length);

            if (allKeys.length > 0) {
                console.log('\nAvailable keys:');
                allKeys.forEach(k => {
                    console.log(`  - ${k.prefix}...${k.suffix} (Status: ${k.status})`);
                });
                console.log('\n❌ The API key you are using does not exist!');
                console.log('You need to create an API key for the employee3 bot in the dashboard.');
            } else {
                console.log('\n❌ No API keys exist in the database!');
                console.log('Create an API key in the dashboard first.');
            }
        } else {
            console.log('\n✓ API key found!');
            console.log('Status:', key.status);
            console.log('Bot ID:', key.botId);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkApiKey();
