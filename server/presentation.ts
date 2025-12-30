/**
 * Presentation API service for creating Google Slides presentations
 * Refactored with improved error handling, validation, and security
 */

import { google } from 'googleapis';
import type { Profile } from '@shared/schema';
import { storage } from './storage';
import { refreshGoogleToken, needsTokenRefresh } from './utils/token-manager';
import { validateImageUrl, isPublicUrl } from './utils/url-validator';
import {
  GoogleAuthError,
  TokenExpiredError,
  BatchSizeExceededError,
  InvalidImageUrlError,
  ImageInsertionError,
  SpeakerNotesError,
} from './errors/presentation-errors';
import {
  GOOGLE_API_BATCH_SIZE,
  MAX_REQUESTS_PER_SLIDE,
  FONT_SIZE_TITLE_PT,
  FONT_SIZE_SUBTITLE_PT,
  FONT_SIZE_BODY_PT,
  FONT_SIZE_BULLETS_PT,
  FONT_SIZE_QUESTIONS_PT,
  TITLE_BOX_WIDTH_EMU,
  TITLE_BOX_HEIGHT_EMU,
  SUBTITLE_BOX_HEIGHT_EMU,
  CONTENT_BOX_WIDTH_EMU,
  CONTENT_BOX_HEIGHT_EMU,
  BULLET_BOX_HEIGHT_EMU,
  QUESTIONS_BOX_HEIGHT_EMU,
  TITLE_POSITION_X_EMU,
  TITLE_POSITION_Y_EMU,
  SUBTITLE_POSITION_Y_EMU,
  CONTENT_POSITION_WITH_TITLE_Y_EMU,
  CONTENT_POSITION_NO_TITLE_Y_EMU,
  DEFAULT_IMAGE_WIDTH_EMU,
  DEFAULT_IMAGE_HEIGHT_EMU,
  IMAGE_POSITION_X_EMU,
  IMAGE_POSITION_Y_EMU,
  COLOR_THEMES,
  type ColorTheme,
} from './constants/slides';

const slides = google.slides('v1');

/**
 * Get OAuth2 client for a user with automatic token refresh
 */
async function getOAuth2Client(user: Profile): Promise<{ auth: any; user: Profile }> {
  if (!user.googleAccessToken || !user.googleRefreshToken) {
    throw new GoogleAuthError();
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/google/callback`
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry ? new Date(user.googleTokenExpiry).getTime() : undefined,
  });

  // Refresh token if expired or expiring soon (within 5 minutes)
  let updatedUser = user;
  if (needsTokenRefresh(user.googleTokenExpiry)) {
    try {
      updatedUser = await refreshGoogleToken(user, oauth2Client);
      oauth2Client.setCredentials({
        access_token: updatedUser.googleAccessToken!,
        refresh_token: updatedUser.googleRefreshToken!,
        expiry_date: updatedUser.googleTokenExpiry ? new Date(updatedUser.googleTokenExpiry).getTime() : undefined,
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new TokenExpiredError();
    }
  }

  return { auth: oauth2Client, user: updatedUser };
}

export interface SlideContent {
  type: 'title' | 'content' | 'image' | 'questions';
  title?: string;
  subtitle?: string;
  text?: string;
  bulletPoints?: string[];
  imageUrl?: string;
  imageAlt?: string;
  imageAttribution?: string;
  questions?: string[];
  notes?: string;
}

export interface CreatePresentationOptions {
  colorTheme?: ColorTheme;
  allowUntrustedImages?: boolean;
}

/**
 * Create a new Google Slides presentation
 */
export async function createPresentation(
  user: Profile,
  title: string
): Promise<{ presentationId: string; url: string }> {
  const { auth } = await getOAuth2Client(user);

  const response = await slides.presentations.create({
    auth,
    requestBody: {
      title,
    },
  });

  const presentationId = response.data.presentationId!;
  const url = `https://docs.google.com/presentation/d/${presentationId}/edit`;

  return { presentationId, url };
}

/**
 * Validates slide content for batch size limits
 */
function validateSlideContent(slideContents: SlideContent[]): void {
  slideContents.forEach((content, index) => {
    let requestCount = 1; // createSlide request

    if (content.title) requestCount += 3; // createShape, insertText, updateTextStyle
    if (content.subtitle) requestCount += 3;
    if (content.text) requestCount += 3;
    if (content.bulletPoints && content.bulletPoints.length > 0) requestCount += 3;
    if (content.questions && content.questions.length > 0) requestCount += 3;
    if (content.imageUrl) requestCount += 1; // createImage
    if (content.notes) requestCount += 1; // speaker notes attempt

    if (requestCount > MAX_REQUESTS_PER_SLIDE * 2) {
      throw new BatchSizeExceededError(index, requestCount);
    }
  });
}

/**
 * Validates and sanitizes image URLs
 */
function validateSlideImages(
  slideContents: SlideContent[],
  allowUntrusted: boolean = false
): SlideContent[] {
  return slideContents.map((slide, index) => {
    if (!slide.imageUrl) return slide;

    try {
      const validatedUrl = validateImageUrl(slide.imageUrl, allowUntrusted);

      // Additional check for public accessibility
      if (validatedUrl && !isPublicUrl(validatedUrl)) {
        console.warn(`Slide ${index}: Image URL may not be publicly accessible: ${validatedUrl}`);
      }

      return { ...slide, imageUrl: validatedUrl };
    } catch (error) {
      console.error(`Slide ${index}: Image validation failed:`, error);
      // Remove invalid image but keep the slide
      return { ...slide, imageUrl: undefined };
    }
  });
}

/**
 * Creates requests for a single slide with error handling
 */
function createSlideRequests(
  content: SlideContent,
  index: number,
  colorTheme?: ColorTheme
): any[] {
  const slideId = `slide_${index}`;
  const requests: any[] = [];
  const theme = colorTheme ? COLOR_THEMES[colorTheme] : undefined;

  // Create blank slide
  requests.push({
    createSlide: {
      objectId: slideId,
      insertionIndex: index,
      slideLayoutReference: {
        predefinedLayout: 'BLANK',
      },
    },
  });

  // Add title
  if (content.title) {
    const titleBoxId = `title_${index}`;
    requests.push({
      createShape: {
        objectId: titleBoxId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            height: { magnitude: TITLE_BOX_HEIGHT_EMU, unit: 'EMU' },
            width: { magnitude: TITLE_BOX_WIDTH_EMU, unit: 'EMU' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: TITLE_POSITION_X_EMU,
            translateY: TITLE_POSITION_Y_EMU,
            unit: 'EMU',
          },
        },
      },
    });

    requests.push({
      insertText: {
        objectId: titleBoxId,
        text: content.title,
      },
    });

    requests.push({
      updateTextStyle: {
        objectId: titleBoxId,
        style: {
          fontSize: { magnitude: FONT_SIZE_TITLE_PT, unit: 'PT' },
          bold: true,
          foregroundColor: theme ? { opaqueColor: { rgbColor: theme.primary } } : undefined,
        },
        fields: theme ? 'fontSize,bold,foregroundColor' : 'fontSize,bold',
      },
    });
  }

  // Add subtitle
  if (content.subtitle) {
    const subtitleBoxId = `subtitle_${index}`;
    requests.push({
      createShape: {
        objectId: subtitleBoxId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            height: { magnitude: SUBTITLE_BOX_HEIGHT_EMU, unit: 'EMU' },
            width: { magnitude: TITLE_BOX_WIDTH_EMU, unit: 'EMU' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: TITLE_POSITION_X_EMU,
            translateY: SUBTITLE_POSITION_Y_EMU,
            unit: 'EMU',
          },
        },
      },
    });

    requests.push({
      insertText: {
        objectId: subtitleBoxId,
        text: content.subtitle,
      },
    });

    requests.push({
      updateTextStyle: {
        objectId: subtitleBoxId,
        style: {
          fontSize: { magnitude: FONT_SIZE_SUBTITLE_PT, unit: 'PT' },
          foregroundColor: theme ? { opaqueColor: { rgbColor: theme.secondary } } : undefined,
        },
        fields: theme ? 'fontSize,foregroundColor' : 'fontSize',
      },
    });
  }

  // Add text content
  if (content.text) {
    const textBoxId = `text_${index}`;
    const yPosition = content.title ? CONTENT_POSITION_WITH_TITLE_Y_EMU : CONTENT_POSITION_NO_TITLE_Y_EMU;

    requests.push({
      createShape: {
        objectId: textBoxId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            height: { magnitude: CONTENT_BOX_HEIGHT_EMU, unit: 'EMU' },
            width: { magnitude: CONTENT_BOX_WIDTH_EMU, unit: 'EMU' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: TITLE_POSITION_X_EMU,
            translateY: yPosition,
            unit: 'EMU',
          },
        },
      },
    });

    requests.push({
      insertText: {
        objectId: textBoxId,
        text: content.text,
      },
    });

    requests.push({
      updateTextStyle: {
        objectId: textBoxId,
        style: {
          fontSize: { magnitude: FONT_SIZE_BODY_PT, unit: 'PT' },
        },
        fields: 'fontSize',
      },
    });
  }

  // Add bullet points
  if (content.bulletPoints && content.bulletPoints.length > 0) {
    const bulletBoxId = `bullets_${index}`;
    const yPosition = content.title ? CONTENT_POSITION_WITH_TITLE_Y_EMU : CONTENT_POSITION_NO_TITLE_Y_EMU;

    requests.push({
      createShape: {
        objectId: bulletBoxId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            height: { magnitude: BULLET_BOX_HEIGHT_EMU, unit: 'EMU' },
            width: { magnitude: CONTENT_BOX_WIDTH_EMU, unit: 'EMU' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: TITLE_POSITION_X_EMU,
            translateY: yPosition,
            unit: 'EMU',
          },
        },
      },
    });

    const bulletText = content.bulletPoints.map(point => `• ${point}`).join('\n');
    requests.push({
      insertText: {
        objectId: bulletBoxId,
        text: bulletText,
      },
    });

    requests.push({
      updateTextStyle: {
        objectId: bulletBoxId,
        style: {
          fontSize: { magnitude: FONT_SIZE_BULLETS_PT, unit: 'PT' },
        },
        fields: 'fontSize',
      },
    });
  }

  // Add questions
  if (content.questions && content.questions.length > 0) {
    const questionsBoxId = `questions_${index}`;
    const yPosition = content.title ? CONTENT_POSITION_WITH_TITLE_Y_EMU : CONTENT_POSITION_NO_TITLE_Y_EMU;

    requests.push({
      createShape: {
        objectId: questionsBoxId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            height: { magnitude: QUESTIONS_BOX_HEIGHT_EMU, unit: 'EMU' },
            width: { magnitude: CONTENT_BOX_WIDTH_EMU, unit: 'EMU' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: TITLE_POSITION_X_EMU,
            translateY: yPosition,
            unit: 'EMU',
          },
        },
      },
    });

    const questionsText = content.questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n');
    requests.push({
      insertText: {
        objectId: questionsBoxId,
        text: questionsText,
      },
    });

    requests.push({
      updateTextStyle: {
        objectId: questionsBoxId,
        style: {
          fontSize: { magnitude: FONT_SIZE_QUESTIONS_PT, unit: 'PT' },
        },
        fields: 'fontSize',
      },
    });
  }

  // Add image (with validation)
  if (content.imageUrl) {
    try {
      requests.push({
        createImage: {
          url: content.imageUrl,
          elementProperties: {
            pageObjectId: slideId,
            size: {
              height: { magnitude: DEFAULT_IMAGE_HEIGHT_EMU, unit: 'EMU' },
              width: { magnitude: DEFAULT_IMAGE_WIDTH_EMU, unit: 'EMU' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: IMAGE_POSITION_X_EMU,
              translateY: IMAGE_POSITION_Y_EMU,
              unit: 'EMU',
            },
          },
        },
      });
    } catch (error) {
      console.error(`Failed to add image to slide ${index}:`, error);
      throw new ImageInsertionError(index, content.imageUrl, error as Error);
    }
  }

  return requests;
}

/**
 * Add slides to a presentation with improved error handling and parallel processing
 */
export async function addSlidesToPresentation(
  user: Profile,
  presentationId: string,
  slideContents: SlideContent[],
  options: CreatePresentationOptions = {}
): Promise<{ successCount: number; failedSlides: number[]; warnings: string[] }> {
  const { auth } = await getOAuth2Client(user);
  const warnings: string[] = [];
  const failedSlides: number[] = [];

  // Validate slide content for batch size
  validateSlideContent(slideContents);

  // Validate and sanitize image URLs
  const validatedSlides = validateSlideImages(slideContents, options.allowUntrustedImages);

  // Get presentation to find the first slide ID
  const presentation = await slides.presentations.get({
    auth,
    presentationId,
  });

  const firstSlideId = presentation.data.slides?.[0]?.objectId;
  const allRequests: any[] = [];

  // Delete the default blank slide if it exists
  if (firstSlideId) {
    allRequests.push({
      deleteObject: {
        objectId: firstSlideId,
      },
    });
  }

  // Create requests for all slides
  validatedSlides.forEach((content, index) => {
    try {
      const slideRequests = createSlideRequests(content, index, options.colorTheme);
      allRequests.push(...slideRequests);
    } catch (error) {
      console.error(`Failed to create requests for slide ${index}:`, error);
      failedSlides.push(index);
      warnings.push(`Slide ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Execute all requests in batches
  const batches = [];
  for (let i = 0; i < allRequests.length; i += GOOGLE_API_BATCH_SIZE) {
    const batch = allRequests.slice(i, i + GOOGLE_API_BATCH_SIZE);
    batches.push(batch);
  }

  // Process batches with error handling
  let successCount = 0;
  for (let i = 0; i < batches.length; i++) {
    try {
      await slides.presentations.batchUpdate({
        auth,
        presentationId,
        requestBody: {
          requests: batches[i],
        },
      });
      successCount++;
    } catch (error) {
      console.error(`Batch ${i} failed:`, error);
      warnings.push(`Batch ${i} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Attempt to add speaker notes (non-blocking)
  for (let i = 0; i < validatedSlides.length; i++) {
    const content = validatedSlides[i];
    if (content.notes) {
      try {
        await addSpeakerNotes(auth, presentationId, `slide_${i}`, content.notes);
      } catch (error) {
        console.warn(`Failed to add speaker notes to slide ${i}:`, error);
        warnings.push(`Slide ${i}: Speaker notes could not be added`);
      }
    }
  }

  return {
    successCount: validatedSlides.length - failedSlides.length,
    failedSlides,
    warnings,
  };
}

/**
 * Attempts to add speaker notes to a slide (best effort)
 */
async function addSpeakerNotes(
  auth: any,
  presentationId: string,
  slideId: string,
  notes: string
): Promise<void> {
  try {
    // Get slide details to find notes page
    const presentation = await slides.presentations.get({
      auth,
      presentationId,
    });

    const slide = presentation.data.slides?.find(s => s.objectId === slideId);
    if (!slide || !slide.slideProperties?.notesPage) {
      throw new Error('Notes page not found');
    }

    const notesPageId = slide.slideProperties.notesPage.objectId;
    if (!notesPageId) {
      throw new Error('Notes page ID not available');
    }

    // Find the notes placeholder
    const notesPage = slide.slideProperties.notesPage;
    const notesShape = notesPage.pageElements?.find(
      el => el.shape?.placeholder?.type === 'BODY'
    );

    if (!notesShape || !notesShape.objectId) {
      throw new Error('Notes shape not found');
    }

    // Insert notes text
    await slides.presentations.batchUpdate({
      auth,
      presentationId,
      requestBody: {
        requests: [
          {
            insertText: {
              objectId: notesShape.objectId,
              text: notes,
            },
          },
        ],
      },
    });
  } catch (error) {
    // Speaker notes are not critical, log but don't throw
    console.warn('Speaker notes addition failed:', error);
    throw new SpeakerNotesError(parseInt(slideId.replace('slide_', '')));
  }
}
