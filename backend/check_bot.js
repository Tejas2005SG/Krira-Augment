// Quick script to check bot configuration
import mongoose from 'mongoose';
import { Chatbot } from './src/models/chatbot.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkBot() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // Find bot by name
        const bot = await Chatbot.findOne({ name: 'employee3' });

        if (!bot) {
            console.log('\n❌ Bot "employee3" not found!');
            console.log('Available bots:');
            const allBots = await Chatbot.find({}).select('name');
            allBots.forEach(b => console.log(`  - ${b.name}`));
            process.exit(1);
        }

        console.log('\n✓ Bot "employee3" found!');
        console.log('Bot ID:', bot._id.toString());

        // Check dataset configuration
        console.log('\n=== DATASET CONFIGURATION ===');
        if (!bot.dataset || !bot.dataset.files || bot.dataset.files.length === 0) {
            console.log('❌ No dataset files configured!');
        } else {
            console.log('✓ Dataset files:', bot.dataset.files.length);
            bot.dataset.files.forEach(file => {
                console.log(`  - ${file.name} (ID: ${file.datasetId}, Chunks: ${file.chunks})`);
            });
        }

        // Check embedding configuration
        console.log('\n=== EMBEDDING CONFIGURATION ===');
        if (!bot.embedding) {
            console.log('❌ No embedding configuration!');
        } else {
            console.log('Model:', bot.embedding.model || '❌ NOT SET');
            console.log('Dimension:', bot.embedding.dimension || '❌ NOT SET');
            console.log('Vector Store:', bot.embedding.vectorStore || '❌ NOT SET');
            console.log('Is Embedded:', bot.embedding.isEmbedded || false);

            if (bot.embedding.datasetIds && bot.embedding.datasetIds.length > 0) {
                console.log('✓ Dataset IDs:', bot.embedding.datasetIds);
            } else {
                console.log('❌ No dataset IDs configured!');
            }

            if (bot.embedding.pineconeConfig) {
                console.log('\nPinecone Config:');
                console.log('  Index Name:', bot.embedding.pineconeConfig.indexName || '❌ NOT SET');
                console.log('  API Key:', bot.embedding.pineconeConfig.apiKey ? '***' + bot.embedding.pineconeConfig.apiKey.slice(-4) : '❌ NOT SET');
                console.log('  Namespace:', bot.embedding.pineconeConfig.namespace || '(default)');
            } else {
                console.log('❌ No Pinecone configuration!');
            }
        }

        // Check LLM configuration
        console.log('\n=== LLM CONFIGURATION ===');
        if (!bot.llm) {
            console.log('❌ No LLM configuration!');
        } else {
            console.log('Provider:', bot.llm.provider || '❌ NOT SET');
            console.log('Model:', bot.llm.model || '❌ NOT SET');
            console.log('Top K:', bot.llm.topK || '❌ NOT SET');
            console.log('System Prompt:', bot.llm.systemPrompt ? 'SET (' + bot.llm.systemPrompt.length + ' chars)' : '❌ NOT SET');
        }

        // Identify missing configuration
        console.log('\n=== CONFIGURATION STATUS ===');
        const issues = [];

        if (!bot.dataset || !bot.dataset.files || bot.dataset.files.length === 0) {
            issues.push('No dataset files uploaded');
        }

        if (!bot.embedding || !bot.embedding.datasetIds || bot.embedding.datasetIds.length === 0) {
            issues.push('No dataset IDs in embedding config');
        }

        if (!bot.embedding || !bot.embedding.pineconeConfig || !bot.embedding.pineconeConfig.apiKey) {
            issues.push('Pinecone API key not configured');
        }

        if (!bot.embedding || !bot.embedding.pineconeConfig || !bot.embedding.pineconeConfig.indexName) {
            issues.push('Pinecone index name not configured');
        }

        if (!bot.llm || !bot.llm.provider || !bot.llm.model) {
            issues.push('LLM not configured');
        }

        if (issues.length > 0) {
            console.log('❌ Issues found:');
            issues.forEach(issue => console.log(`  - ${issue}`));
        } else {
            console.log('✓ Bot configuration looks complete!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkBot();
