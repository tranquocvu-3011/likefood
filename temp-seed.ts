import { seedKnowledgeBase } from './src/lib/ai/knowledge-base';

seedKnowledgeBase()
    .then(() => console.log('Knowledge base seeded successfully.'))
    .catch(console.error);
