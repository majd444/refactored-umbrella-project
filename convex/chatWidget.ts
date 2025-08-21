import { httpAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Types for the widget API
type AgentResponse = {
  id: Id<"agents">;
  name: string;
  welcomeMessage: string;
  systemPrompt: string;
  temperature: number;
  headerColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  profileImage?: string;
};

type SessionResponse = {
  sessionId: Id<"chatSessions">;
  agent: AgentResponse;
};

type ChatResponse = {
  reply: string;
  sessionId: Id<"chatSessions">;
};

// Utility function to handle CORS headers
function corsResponse(json: unknown, status = 200) {
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

// Handle CORS preflight requests
const options = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
});

// AI Response Generation
async function generateAIResponse(params: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature: number;
  model: string;
}): Promise<string> {
  // TODO: Replace with your actual AI provider integration
  // This is a placeholder implementation
  const { messages } = params;
  const lastMessage = messages[messages.length - 1];
  
  if (lastMessage.role !== 'user') {
    throw new Error('Last message must be from user');
  }

  // Simulate AI response
  return `This is a simulated response to: "${lastMessage.content}"`;
}

// Create a new widget session
export const createWidgetSession = httpAction(async (ctx, req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsResponse({});
  }

  try {
    const body = await req.json();
    const agentId = body?.agentId as Id<"agents">;
    
    if (!agentId) {
      return corsResponse({ error: 'agentId is required' }, 400);
    }

    // Fetch agent details from the database
    const agent = await ctx.runQuery(api.agents.get, { id: agentId });
    
    if (!agent) {
      return corsResponse({ error: 'Agent not found' }, 404);
    }

    // Create a new session
    const sessionId = await ctx.runMutation(api.sessions.createSession, {
      agentId,
      userId: 'widget-user', // Can be a guest ID for anonymous users
      metadata: {
        userAgent: req.headers.get('user-agent') || 'unknown',
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    // Prepare the response with agent theming
    const response: SessionResponse = {
      sessionId,
      agent: {
        id: agent._id,
        name: agent.name,
        welcomeMessage: agent.welcomeMessage,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        headerColor: agent.headerColor,
        accentColor: agent.accentColor,
        backgroundColor: agent.backgroundColor,
        profileImage: agent.profileImage,
      },
    };

    return corsResponse(response);
  } catch (error) {
    console.error('Error creating widget session:', error);
    return corsResponse({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Handle widget chat messages
export const widgetChat = httpAction(async (ctx, req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsResponse({});
  }

  try {
    const body = await req.json();
    const { sessionId, agentId, message, history = [] } = body as {
      sessionId: Id<"chatSessions">;
      agentId: Id<"agents">;
      message: string;
      history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    };

    if (!sessionId || !agentId || !message) {
      return corsResponse({ error: 'sessionId, agentId, and message are required' }, 400);
    }

    // Verify the session exists and belongs to this agent
    const session = await ctx.runQuery(api.sessions.getSession, { id: sessionId });
    if (!session) {
      return corsResponse({ error: 'Session not found' }, 404);
    }

    if (session.agentId !== agentId) {
      return corsResponse({ error: 'Session does not belong to this agent' }, 403);
    }

    // Get the agent
    const agent = await ctx.runQuery(api.agents.get, { id: agentId });
    if (!agent) {
      return corsResponse({ error: 'Agent not found' }, 404);
    }

    // Add the user message to the database
    await ctx.runMutation(api.sessions.createMessage, {
      sessionId,
      role: 'user',
      content: message,
      metadata: {}
    });

    // Prepare messages for AI
    const messages = [
      { role: 'system' as const, content: agent.systemPrompt },
      ...history,
      { role: 'user' as const, content: message }
    ];

    // Generate AI response
    const aiResponse = await generateAIResponse({
      messages,
      temperature: agent.temperature || 0.7,
      model: 'gpt-3.5-turbo',
    });

    // Save assistant's response
    await ctx.runMutation(api.sessions.createMessage, {
      sessionId,
      role: 'assistant',
      content: aiResponse,
      metadata: {}
    });

    // Update session last active
    await ctx.runMutation(api.sessions.updateSessionLastActive, { id: sessionId });

    // Return the response
    const response: ChatResponse = {
      reply: aiResponse,
      sessionId,
    };

    return corsResponse(response);
  } catch (error) {
    console.error('Error processing chat message:', error);
    return corsResponse({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Export the API routes
export const http = {
  '/api/chat/widget/session': {
    POST: createWidgetSession,
    OPTIONS: options,
  },
  '/api/chat/widget/chat': {
    POST: widgetChat,
    OPTIONS: options,
  },
  // Add a health check endpoint
  '/health': {
    GET: async () => corsResponse({ status: 'ok' }),
    OPTIONS: options,
  },
} as const;
