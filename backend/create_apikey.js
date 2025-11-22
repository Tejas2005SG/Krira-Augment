// Get employee3 bot details and create API key
import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const generateRawKey = () => `sk-live-${crypto.randomBytes(28).toString("hex")}`;
const hashApiKey = (apiKey) => crypto.createHash("sha256").update(apiKey).digest("hex");

async function createApiKey() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // Find the employee3 bot
        const Chatbot = mongoose.model('Chatbot');
        const bot = await Chatbot.findOne({ name: 'employee3' });

        if (!bot) {
            console.log('❌ Bot employee3 not found!');
            return;
        }

        console.log('✓ Found bot:', bot.name);
        console.log('  Bot ID:', bot._id.toString());
        console.log('  User ID:', bot.userId.toString());

        // Check if API key already exists for this bot
        const ApiKey = mongoose.model('ApiKey');
        const existingKeys = await ApiKey.find({ botId: bot._id });

        console.log(`\nExisting API keys for this bot: ${existingKeys.length}`);

        if (existingKeys.length > 0) {
            console.log('\nExisting keys:');
            existingKeys.forEach(key => {
                console.log(`  ${key.prefix}...${key.suffix} (${key.name}, Status: ${key.status})`);
            });
        }

        // Create a new API key with the exact value we're using
        const specificKey = "sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432";
        const keyHash = hashApiKey(specificKey);
        const prefix = specificKey.slice(0, 8);
        const suffix = specificKey.slice(-4);

        //  Check if this specific key exists
        const existingSpecificKey = await ApiKey.findOne({ keyHash });

        if (existingSpecificKey) {
            console.log('\n✓ The API key you are using already exists!');
            console.log('  Name:', existingSpecificKey.name);
            console.log('  Status:', existingSpecificKey.status);
            console.log('  Bot ID:', existingSpecificKey.botId.toString());

            if (existingSpecificKey.status !== 'active') {
                console.log('\n❌ Key is not active! Activating...');
                existingSpecificKey.status = 'active';
                await existingSpecificKey.save();
                console.log('✓ Key activated!');
            }

            if (existingSpecificKey.botId.toString() !== bot._id.toString()) {
                console.log(`\n⚠️  Key is linked to different bot!`);
                console.log(`  Updating to link to ${bot.name}...`);
                existingSpecificKey.botId = bot._id;
                existingSpecificKey.botNameSnapshot = bot.name;
                await existingSpecificKey.save();
                console.log('✓ Updated!');
            }
        } else {
            console.log('\n  Creating API key with the exact value you are using...');

            const apiKeyDoc = new ApiKey({
                name: 'SDK Test Key',
                userId: bot.userId,
                botId: bot._id,
                botNameSnapshot: bot.name,
                botSlugSnapshot: bot.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                keyHash: keyHash,
                prefix: prefix,
                suffix: suffix,
                permissions: ['chat'],
                status: 'active'
            });

            await apiKeyDoc.save();
            console.log('✓ API key created!');
            console.log('  Key:', specificKey);
            console.log('  Name:', apiKeyDoc.name);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createApiKey();
