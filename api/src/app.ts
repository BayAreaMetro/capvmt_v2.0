import express from 'express';

export const app = express();
app.use(express.json());

// Routes are added in Task 3 (health, VMT read endpoints over the Socrata client).
