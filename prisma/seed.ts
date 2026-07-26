import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Velicham database...");

  // Clean existing data
  await prisma.comment.deleteMany();
  await prisma.noteRelation.deleteMany();
  await prisma.note.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: "Mujthaba",
      email: "admin@velicham.com",
      role: "ADMIN",
      galaxyConfig: JSON.stringify({ theme: "cosmic", starDensity: "high" }),
    },
  });

  // Create Channels
  const channel1 = await prisma.channel.create({
    data: {
      name: "3Blue1Brown",
      youtubeChannelId: "UCYO_jab_esuFRV4b17AJtAw",
      description: "Visualizing mathematics & neural networks",
      avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_k9_...",
    },
  });

  const channel2 = await prisma.channel.create({
    data: {
      name: "Fireship",
      youtubeChannelId: "UCsBjURrP6M7yp9VTuiS9LwA",
      description: "High-intensity code tutorials & tech news",
      avatarUrl: "https://yt3.googleusercontent.com/ytc/AIdro_n...",
    },
  });

  // Create Topics
  const topicAI = await prisma.topic.create({
    data: {
      title: "Artificial Intelligence & LLMs",
      slug: "artificial-intelligence-llms",
      description: "Neural networks, transformer architectures, and generative models.",
      icon: "brain",
      channelId: channel1.id,
    },
  });

  const topicWeb = await prisma.topic.create({
    data: {
      title: "Modern Web Architecture",
      slug: "modern-web-architecture",
      description: "Next.js, Server Components, and full-stack system design.",
      icon: "globe",
      channelId: channel2.id,
    },
  });

  const topicPhysics = await prisma.topic.create({
    data: {
      title: "Quantum & Astrophysics",
      slug: "quantum-astrophysics",
      description: "Cosmic structures, quantum mechanics, and deep space exploration.",
      icon: "sparkles",
    },
  });

  // Create Notes
  const note1 = await prisma.note.create({
    data: {
      title: "How Transformer Neural Networks Work",
      slug: "how-transformer-neural-networks-work",
      summary:
        "Deep dive into attention mechanisms, positional encodings, and matrix multiplications behind GPT models.",
      content: `
# How Transformer Neural Networks Work

Transformer architectures revolutionized machine learning by introducing **self-attention**.

## Key Takeaways
- [01:15] Self-attention allows tokens to attend to all other tokens simultaneously.
- [04:30] Query, Key, and Value vectors map contextual relevance.
- [08:45] Positional encodings preserve sequence order without recurrence.

Connected concepts: [[artificial-intelligence-llms]] and [[modern-web-architecture]].
      `,
      youtubeUrl: "https://www.youtube.com/watch?v=wjZofJX0v4M",
      videoId: "wjZofJX0v4M",
      timestamps: JSON.stringify([
        { timestamp: "01:15", text: "Self-attention mechanism explained" },
        { timestamp: "04:30", text: "Q, K, V matrix calculations" },
        { timestamp: "08:45", text: "Positional embeddings" },
      ]),
      topicId: topicAI.id,
      authorId: channel1.id,
    },
  });

  const note2 = await prisma.note.create({
    data: {
      title: "Next.js App Router Architecture Deep Dive",
      slug: "nextjs-app-router-architecture",
      summary:
        "Understanding React Server Components, streaming SSR, and server actions in modern web development.",
      content: `
# Next.js App Router Architecture

The App Router shifts rendering paradigm to the server by default.

## Highlights
- [00:45] Server Components execute strictly on Node.js environment.
- [03:20] Streaming HTML via React Suspense boundaries.
- [07:10] Server Actions perform type-safe RPC data mutations.

Related reading: [[how-transformer-neural-networks-work]] and [[artificial-intelligence-llms]].
      `,
      youtubeUrl: "https://www.youtube.com/watch?v=wm5gMKCOBik",
      videoId: "wm5gMKCOBik",
      timestamps: JSON.stringify([
        { timestamp: "00:45", text: "Server Components vs Client Components" },
        { timestamp: "03:20", text: "Streaming HTML & Suspense" },
        { timestamp: "07:10", text: "Server Actions mutation model" },
      ]),
      topicId: topicWeb.id,
      authorId: channel2.id,
    },
  });

  const note3 = await prisma.note.create({
    data: {
      title: "Understanding Black Holes & Space-Time Geometry",
      slug: "understanding-black-holes-spacetime",
      summary:
        "Exploring Einstein's general relativity, event horizons, and gravitational lensing in deep space.",
      content: `
# Understanding Black Holes & Space-Time Geometry

Black holes represent extreme curvature in space-time geometry predicted by general relativity.

## Key Insights
- [02:10] Event horizons mark the point of no return for photons.
- [06:40] Gravitational lensing bends light around massive celestial bodies.
- [11:15] Hawking radiation and quantum thermodynamics.

Connects to: [[quantum-astrophysics]] and [[how-transformer-neural-networks-work]].
      `,
      youtubeUrl: "https://www.youtube.com/watch?v=e-P5IFTqB98",
      videoId: "e-P5IFTqB98",
      timestamps: JSON.stringify([
        { timestamp: "02:10", text: "Event Horizon physics" },
        { timestamp: "06:40", text: "Gravitational lensing visualization" },
        { timestamp: "11:15", text: "Hawking radiation" },
      ]),
      topicId: topicPhysics.id,
      authorId: channel1.id,
    },
  });

  // Create Graph Edges (NoteRelations)
  await prisma.noteRelation.createMany({
    data: [
      {
        sourceNoteId: note1.id,
        targetNoteId: note2.id,
        type: "bi-directional",
      },
      {
        sourceNoteId: note1.id,
        targetNoteId: note3.id,
        type: "bi-directional",
      },
      {
        sourceNoteId: note2.id,
        targetNoteId: note3.id,
        type: "bi-directional",
      },
    ],
  });

  // Create Comments
  await prisma.comment.create({
    data: {
      noteId: note1.id,
      userId: admin.id,
      content: "Great breakdown of attention mechanism! Is multi-head attention mandatory for all LLMs?",
      status: "AI_REPLIED",
      aiReply:
        "Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. While some lightweight models experiment with grouped-query attention (GQA) for efficiency, multi-head architecture remains standard.",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
