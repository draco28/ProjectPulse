/**
 * GET /api/onboarding/questions
 * 
 * Sprint 8.6 Phase 1 - Session 1 Questions API
 * 
 * Fetch onboarding questions for a specific phase (1-10)
 * 
 * Query Parameters:
 * - projectId: number (required) - Project ID
 * - phase: number (required) - Phase number (1-10)
 * 
 * Response:
 * - 200: Questions for the phase grouped by subsection
 * - 400: Validation error (missing/invalid parameters)
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PHASE_NAMES: Record<number, string> = {
  1: 'Product Manager - Foundation',
  2: 'Strategic Planning - Business & Tech',
  3: 'UX/UI Design - User Experience',
  4: 'System Architecture - Technical Foundation',
  5: 'DevOps & Local Development',
  6: 'Backend Development',
  7: 'Frontend Development',
  8: 'QA & Testing',
  9: 'Production Deployment',
  10: 'Security & Compliance'
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get('projectId');
    const phaseParam = searchParams.get('phase');
    
    // Validation
    if (!projectIdParam) {
      return NextResponse.json(
        { error: 'projectId query parameter required' },
        { status: 400 }
      );
    }
    
    if (!phaseParam) {
      return NextResponse.json(
        { error: 'phase query parameter required' },
        { status: 400 }
      );
    }
    
    const projectId = parseInt(projectIdParam, 10);
    const phase = parseInt(phaseParam, 10);
    
    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        { error: 'projectId must be a positive integer' },
        { status: 400 }
      );
    }
    
    if (isNaN(phase) || phase < 1 || phase > 10) {
      return NextResponse.json(
        { error: 'phase must be between 1 and 10' },
        { status: 400 }
      );
    }
    
    // Fetch questions from database
    const questions = await prisma.onboardingQuestion.findMany({
      where: { phase },
      orderBy: [
        { subsection: 'asc' },
        { questionNumber: 'asc' }
      ],
      select: {
        id: true,
        phase: true,
        subsection: true,
        questionNumber: true,
        questionText: true,
        placeholder: true,
        helpText: true,
        validationType: true,
        isRequired: true,
        minLength: true,
        maxLength: true
      }
    });
    
    if (questions.length === 0) {
      return NextResponse.json(
        { error: `No questions found for phase ${phase}. Questions may not be seeded yet.` },
        { status: 404 }
      );
    }
    
    // Group by subsection
    const subsectionsMap: Record<string, typeof questions> = {};
    
    questions.forEach((q) => {
      if (!subsectionsMap[q.subsection]) {
        subsectionsMap[q.subsection] = [];
      }
      subsectionsMap[q.subsection].push(q);
    });
    
    const subsections = Object.entries(subsectionsMap).map(([subsectionName, subQuestions]) => ({
      id: subsectionName,
      name: subsectionName,
      questions: subQuestions.map((q) => ({
        id: `phase${q.phase}_q${q.questionNumber}`,
        questionNumber: q.questionNumber,
        text: q.questionText,
        placeholder: q.placeholder,
        helpText: q.helpText,
        validationType: q.validationType,
        isRequired: q.isRequired,
        minLength: q.minLength,
        maxLength: q.maxLength
      }))
    }));
    
    return NextResponse.json({
      phase,
      phaseName: PHASE_NAMES[phase] || `Phase ${phase}`,
      subsections,
      totalQuestions: questions.length
    });
    
  } catch (error) {
    console.error('[GET /api/onboarding/questions] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
