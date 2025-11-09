/**
 * ============================================================================
 * Google Calendar Routes - Calendar Integration API
 * ============================================================================
 * 
 * URL Structure:
 * - Backend API: http://localhost:5000/api/calendar/*
 * - Frontend App: http://localhost:5173/app/calendars
 * - Google OAuth Callback: http://localhost:5000/api/calendar/callback
 *   (This redirects back to frontend after OAuth)
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { google } = require('googleapis');
require('dotenv').config();

// ============================================================================
// Configuration - URLs are clearly separated
// ============================================================================
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GOOGLE_CALLBACK_URL = `${BACKEND_URL}/api/calendar/callback`; // Backend receives OAuth callback
const FRONTEND_CALENDAR_PAGE = `${FRONTEND_URL}/app/calendars`; // Frontend page to redirect to

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Validate Google OAuth credentials
function validateGoogleCredentials() {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return {
            valid: false,
            message: 'Google OAuth credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.'
        };
    }
    return { valid: true };
}

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL // This is the backend URL that Google will redirect to
);

// Scopes required for Google Calendar
const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email'
];

// ============================================================================
// Helper: Get user's Google Calendar tokens
// ============================================================================
async function getUserTokens(userId) {
    try {
        const result = await pool.query(
            `SELECT access_token, refresh_token, expiry_date, token_type
             FROM auth.google_calendar_tokens
             WHERE user_id = $1
             LIMIT 1`,
            [userId]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Error getting user tokens:', error);
        return null;
    }
}

// ============================================================================
// Helper: Save user's Google Calendar tokens
// ============================================================================
async function saveUserTokens(userId, tokens) {
    try {
        const { access_token, refresh_token, expiry_date, token_type } = tokens;
        
        if (!userId || !access_token) {
            return { success: false, error: 'User ID and access token are required' };
        }

        // Check if user exists
        const userCheck = await pool.query(
            'SELECT id FROM auth.users WHERE id = $1',
            [userId]
        );
        
        if (userCheck.rows.length === 0) {
            return { success: false, error: `User with ID ${userId} does not exist` };
        }

        await pool.query(
            `INSERT INTO auth.google_calendar_tokens 
             (user_id, access_token, refresh_token, expiry_date, token_type, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                 access_token = EXCLUDED.access_token,
                 refresh_token = EXCLUDED.refresh_token,
                 expiry_date = EXCLUDED.expiry_date,
                 token_type = EXCLUDED.token_type,
                 updated_at = NOW()`,
            [userId, access_token, refresh_token || null, expiry_date || null, token_type || 'Bearer']
        );
        
        return { success: true };
    } catch (error) {
        console.error('Error saving user tokens:', error);
        return { 
            success: false, 
            error: error.message || 'Database error while saving tokens'
        };
    }
}

// ============================================================================
// Helper: Delete user's Google Calendar tokens
// ============================================================================
async function deleteUserTokens(userId) {
    try {
        await pool.query(
            'DELETE FROM auth.google_calendar_tokens WHERE user_id = $1',
            [userId]
        );
        return true;
    } catch (error) {
        console.error('Error deleting user tokens:', error);
        return false;
    }
}

// ============================================================================
// Helper: Get authenticated calendar client
// ============================================================================
async function getCalendarClient(userId) {
    try {
        const tokens = await getUserTokens(userId);
        if (!tokens) {
            return null;
        }

        oauth2Client.setCredentials({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).getTime() : null,
        });

        // Refresh token if expired
        if (tokens.expiry_date && new Date(tokens.expiry_date) <= new Date()) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            await saveUserTokens(userId, {
                access_token: credentials.access_token,
                refresh_token: credentials.refresh_token || tokens.refresh_token,
                expiry_date: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
                token_type: credentials.token_type || 'Bearer',
            });
            oauth2Client.setCredentials(credentials);
        }

        return google.calendar({ version: 'v3', auth: oauth2Client });
    } catch (error) {
        console.error('Error getting calendar client:', error);
        return null;
    }
}

// ============================================================================
// GET /api/calendar/auth-url
// Frontend calls this to get the Google OAuth URL
// ============================================================================
router.get('/auth-url', async (req, res) => {
    try {
        const validation = validateGoogleCredentials();
        if (!validation.valid) {
            return res.status(500).json({
                success: false,
                message: validation.message,
                error: 'GOOGLE_CREDENTIALS_NOT_CONFIGURED'
            });
        }

        const userId = req.query.user_id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        // Store userId in state parameter (Google will return this to our callback)
        const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
        
        // Generate Google OAuth URL
        // Google will redirect to: BACKEND_URL/api/calendar/callback
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent',
            state: state,
        });

        console.log(`[Calendar] Generated OAuth URL for user ${userId}`);
        console.log(`[Calendar] Callback will be: ${GOOGLE_CALLBACK_URL}`);

        res.status(200).json({
            success: true,
            data: {
                authUrl,
            },
        });
    } catch (error) {
        console.error('[Calendar] Error generating auth URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate authentication URL',
            error: error.message
        });
    }
});

// ============================================================================
// GET /api/calendar/callback
// Google redirects here after OAuth (BACKEND URL)
// Then we redirect to FRONTEND URL
// ============================================================================
router.get('/callback', async (req, res) => {
    try {
        const validation = validateGoogleCredentials();
        if (!validation.valid) {
            return res.redirect(`${FRONTEND_CALENDAR_PAGE}?connected=false&error=${encodeURIComponent(validation.message)}`);
        }

        const { code, state } = req.query;
        if (!code) {
            return res.redirect(`${FRONTEND_CALENDAR_PAGE}?connected=false&error=${encodeURIComponent('Authorization code is required')}`);
        }

        // Extract userId from state parameter
        let userId = null;
        if (state) {
            try {
                const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                userId = stateData.userId;
                console.log(`[Calendar] OAuth callback received for user: ${userId}`);
            } catch (e) {
                console.warn('[Calendar] Failed to parse state parameter:', e);
            }
        }

        if (!userId) {
            return res.redirect(`${FRONTEND_CALENDAR_PAGE}?connected=false&error=${encodeURIComponent('User ID is required')}`);
        }

        // Exchange code for tokens
        let tokens;
        try {
            const tokenResponse = await oauth2Client.getToken(code);
            tokens = tokenResponse.tokens;
            oauth2Client.setCredentials(tokens);
            console.log(`[Calendar] Successfully exchanged code for tokens`);
        } catch (tokenError) {
            console.error('[Calendar] Error exchanging code for tokens:', tokenError);
            return res.redirect(`${FRONTEND_CALENDAR_PAGE}?connected=false&error=${encodeURIComponent(tokenError.message || 'Failed to exchange authorization code')}`);
        }

        // Get user email from Google (for user lookup fallback)
        let googleUserEmail = null;
        try {
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            googleUserEmail = userInfo.data.email;
            console.log(`[Calendar] Google user email: ${googleUserEmail}`);
        } catch (emailError) {
            console.warn('[Calendar] Could not get Google user email:', emailError);
        }

        // Verify user exists, try email lookup if needed
        let finalUserId = userId;
        const userCheck = await pool.query('SELECT id FROM auth.users WHERE id = $1', [userId]);
        
        if (userCheck.rows.length === 0 && googleUserEmail) {
            console.log(`[Calendar] User ID ${userId} not found, trying email lookup: ${googleUserEmail}`);
            const emailCheck = await pool.query(
                'SELECT id FROM auth.users WHERE email = $1',
                [googleUserEmail.toLowerCase()]
            );
            
            if (emailCheck.rows.length > 0) {
                finalUserId = emailCheck.rows[0].id;
                console.log(`[Calendar] Found user by email, using ID: ${finalUserId}`);
            } else {
                return res.redirect(`${FRONTEND_CALENDAR_PAGE}?connected=false&error=${encodeURIComponent(`User not found. Please log in again.`)}`);
            }
        }

        // Save tokens to database
        const saveResult = await saveUserTokens(finalUserId, {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
            token_type: tokens.token_type || 'Bearer',
        });

        if (!saveResult.success) {
            console.error('[Calendar] Failed to save tokens:', saveResult.error);
            return res.redirect(`${FRONTEND_CALENDAR_PAGE}?connected=false&error=${encodeURIComponent(saveResult.error || 'Failed to save authentication tokens')}`);
        }

        console.log(`[Calendar] Successfully saved tokens for user ${finalUserId}`);
        console.log(`[Calendar] Redirecting to frontend: ${FRONTEND_CALENDAR_PAGE}?connected=true`);

        // Redirect to FRONTEND (not backend!)
        res.redirect(`${FRONTEND_CALENDAR_PAGE}?connected=true`);
    } catch (error) {
        console.error('[Calendar] Error in OAuth callback:', error);
        res.redirect(`${FRONTEND_CALENDAR_PAGE}?connected=false&error=${encodeURIComponent(error.message || 'An error occurred')}`);
    }
});

// ============================================================================
// GET /api/calendar/status
// Frontend calls this to check if user is connected
// ============================================================================
router.get('/status', async (req, res) => {
    try {
        const userId = req.query.user_id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        const tokens = await getUserTokens(userId);
        const isConnected = !!tokens;

        res.status(200).json({
            success: true,
            data: {
                connected: isConnected,
            },
        });
    } catch (error) {
        console.error('[Calendar] Error checking status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check connection status',
        });
    }
});

// ============================================================================
// GET /api/calendar/calendars
// Frontend calls this to get list of user's calendars
// ============================================================================
router.get('/calendars', async (req, res) => {
    try {
        const userId = req.query.user_id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        const calendar = await getCalendarClient(userId);
        if (!calendar) {
            return res.status(401).json({
                success: false,
                message: 'Google Calendar not connected. Please connect your account first.',
            });
        }

        const response = await calendar.calendarList.list({
            minAccessRole: 'reader',
        });

        const calendars = response.data.items.map((cal) => ({
            id: cal.id,
            summary: cal.summary,
            description: cal.description,
            backgroundColor: cal.backgroundColor,
            foregroundColor: cal.foregroundColor,
            primary: cal.primary || false,
            accessRole: cal.accessRole,
        }));

        res.status(200).json({
            success: true,
            data: calendars,
        });
    } catch (error) {
        console.error('[Calendar] Error fetching calendars:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch calendars',
        });
    }
});

// ============================================================================
// GET /api/calendar/events
// Frontend calls this to get calendar events
// ============================================================================
router.get('/events', async (req, res) => {
    try {
        const userId = req.query.user_id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        const calendar = await getCalendarClient(userId);
        if (!calendar) {
            return res.status(401).json({
                success: false,
                message: 'Google Calendar not connected. Please connect your account first.',
            });
        }

        // Parse query parameters
        const {
            calendarIds = 'primary', // Comma-separated list
            timeMin,
            timeMax,
            maxResults = 250,
        } = req.query;

        // Default to current month if no date range provided
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const timeMinDate = timeMin ? new Date(timeMin) : startOfMonth;
        const timeMaxDate = timeMax ? new Date(timeMax) : endOfMonth;

        // Parse calendar IDs
        const calendarIdList = calendarIds.split(',').map((id) => id.trim());

        // Fetch events from all specified calendars
        const allEvents = [];
        console.log(`[Calendar] Fetching events for user ${userId}`);
        console.log(`[Calendar] Date range: ${timeMinDate.toISOString()} to ${timeMaxDate.toISOString()}`);
        console.log(`[Calendar] Calendars to fetch: ${calendarIdList.join(', ')}`);
        
        for (const calId of calendarIdList) {
            try {
                const response = await calendar.events.list({
                    calendarId: calId,
                    timeMin: timeMinDate.toISOString(),
                    timeMax: timeMaxDate.toISOString(),
                    maxResults: parseInt(maxResults),
                    singleEvents: true,
                    orderBy: 'startTime',
                });

                console.log(`[Calendar] Calendar ${calId} returned ${response.data.items?.length || 0} events`);

                if (response.data.items) {
                    const events = response.data.items.map((event) => ({
                        id: event.id,
                        calendarId: calId,
                        title: event.summary || '(No title)',
                        description: event.description || '',
                        start: event.start?.dateTime || event.start?.date,
                        end: event.end?.dateTime || event.end?.date,
                        allDay: !event.start?.dateTime,
                        location: event.location || '',
                        attendees: event.attendees || [],
                        status: event.status,
                        htmlLink: event.htmlLink,
                        backgroundColor: event.backgroundColor,
                    }));
                    allEvents.push(...events);
                    console.log(`[Calendar] Processed ${events.length} events from calendar ${calId}`);
                }
            } catch (calError) {
                console.error(`[Calendar] Error fetching events from calendar ${calId}:`, calError);
                // Log more details about the error
                if (calError.response) {
                    console.error(`[Calendar] Error response:`, calError.response.data);
                }
            }
        }
        
        console.log(`[Calendar] Total events fetched: ${allEvents.length}`);

        // Sort events by start time
        allEvents.sort((a, b) => {
            const dateA = new Date(a.start);
            const dateB = new Date(b.start);
            return dateA - dateB;
        });

        res.status(200).json({
            success: true,
            data: allEvents,
        });
    } catch (error) {
        console.error('[Calendar] Error fetching events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch calendar events',
        });
    }
});

// ============================================================================
// GET /api/calendar/upcoming-events
// Frontend calls this to get upcoming events for notifications
// ============================================================================
router.get('/upcoming-events', async (req, res) => {
    try {
        const userId = req.query.user_id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        // Get the user ID that actually has the calendar tokens (Google Calendar user)
        // For upcoming events, we need to find which user has the calendar connected
        const tokenUserCheck = await pool.query(
            'SELECT user_id FROM auth.google_calendar_tokens WHERE user_id = $1',
            [userId]
        );
        
        let calendarUserId = userId;
        if (tokenUserCheck.rows.length === 0) {
            // Login user doesn't have tokens, find the user who does
            const anyTokenUser = await pool.query(
                'SELECT user_id FROM auth.google_calendar_tokens LIMIT 1'
            );
            if (anyTokenUser.rows.length > 0) {
                calendarUserId = anyTokenUser.rows[0].user_id;
                console.log(`[Calendar] Using calendar user ID ${calendarUserId} instead of login user ${userId}`);
            }
        }
        
        const calendar = await getCalendarClient(calendarUserId);
        if (!calendar) {
            return res.status(401).json({
                success: false,
                message: 'Google Calendar not connected. Please connect your account first.',
            });
        }
        
        // Get events: past 7 days + next 7 days (14 days total)
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

        const timeMin = sevenDaysAgo.toISOString();
        const timeMax = sevenDaysLater.toISOString();

        console.log(`[Calendar] Fetching events (past and upcoming) for user ${calendarUserId} from ${timeMin} to ${timeMax}`);

        // Fetch events from primary calendar
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin,
            timeMax: timeMax,
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
        });

        // Parse events: extract name and time, return directly (NO DATABASE)
        const events = (response.data.items || []).map((event) => {
            const startDate = event.start?.dateTime ? new Date(event.start.dateTime) : new Date(event.start?.date || now);
            const endDate = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(event.end?.date || now);
            const isAllDay = !event.start?.dateTime;
            
            // Calculate time until event
            const timeUntil = startDate.getTime() - now.getTime();
            const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
            const daysUntil = Math.floor(hoursUntil / 24);
            const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

            // Determine urgency and time label
            let urgency = 'normal';
            let timeLabel = '';
            if (timeUntil < 0) {
                urgency = 'past';
                if (daysUntil === -1) {
                    timeLabel = 'Yesterday';
                } else if (daysUntil >= -7) {
                    timeLabel = `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago`;
                } else {
                    timeLabel = 'Past event';
                }
            } else if (hoursUntil < 1) {
                urgency = 'urgent';
                timeLabel = minutesUntil <= 0 ? 'Starting now' : `In ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`;
            } else if (hoursUntil < 24) {
                urgency = 'soon';
                timeLabel = `In ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
            } else if (daysUntil === 1) {
                urgency = 'upcoming';
                timeLabel = 'Tomorrow';
            } else if (daysUntil <= 7) {
                urgency = 'upcoming';
                timeLabel = `In ${daysUntil} days`;
            } else {
                urgency = 'normal';
                timeLabel = `In ${daysUntil} days`;
            }

            return {
                id: event.id,
                title: event.summary || '(No title)', // Event name
                description: event.description || '',
                start: event.start?.dateTime || event.start?.date,
                end: event.end?.dateTime || event.end?.date,
                allDay: isAllDay,
                location: event.location || '',
                htmlLink: event.htmlLink || '',
                timeUntil: timeUntil,
                hoursUntil: hoursUntil,
                daysUntil: daysUntil,
                minutesUntil: minutesUntil,
                urgency: urgency,
                timeLabel: timeLabel,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            };
        });

        // Sort by start time (upcoming first)
        events.sort((a, b) => a.timeUntil - b.timeUntil);

        console.log(`[Calendar] Returning ${events.length} events directly from Google Calendar`);

        res.status(200).json({
            success: true,
            data: events,
        });
    } catch (error) {
        console.error('[Calendar] Error fetching upcoming events:', error);
        console.error('[Calendar] Error stack:', error.stack);
        console.error('[Calendar] Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            constraint: error.constraint,
            schema: error.schema,
            table: error.table
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming calendar events',
            error: process.env.NODE_ENV !== 'production' ? {
                message: error.message,
                code: error.code,
                detail: error.detail
            } : undefined,
        });
    }
});

// ============================================================================
// POST /api/calendar/disconnect
// Frontend calls this to disconnect Google Calendar
// ============================================================================
router.post('/disconnect', async (req, res) => {
    try {
        const userId = req.body.user_id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        const deleted = await deleteUserTokens(userId);
        if (!deleted) {
            return res.status(500).json({
                success: false,
                message: 'Failed to disconnect Google Calendar',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Google Calendar disconnected successfully',
        });
    } catch (error) {
        console.error('[Calendar] Error disconnecting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect Google Calendar',
        });
    }
});

module.exports = router;

