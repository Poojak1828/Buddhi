import { prisma } from '../config/db.js';
import { getCurriculumForProfile, CurriculumSubject } from '../data/curriculum.js';

export class CurriculumService {
  /**
   * Syncs and populates subjects, chapters, topics, and relevant flashcards for a student
   * based on their chosen grade class, board, and stream.
   * If existing subjects exist, it intelligently preserves existing work and updates/adds curriculum subjects.
   */
  async populateCurriculumForStudent(
    userId: string,
    profile: {
      gradeClass?: string;
      board?: string;
      stream?: string;
    }
  ): Promise<{
    subjectsAdded: number;
    flashcardsAdded: number;
    curriculumSummary: string;
  }> {
    const gradeClass = profile.gradeClass || 'Class 12';
    const board = profile.board || 'CBSE';
    const stream = profile.stream || 'Science';

    const curriculumSubjects = getCurriculumForProfile({ gradeClass, board, stream });
    let subjectsAdded = 0;
    let flashcardsAdded = 0;

    for (const curSub of curriculumSubjects) {
      // Find or create subject
      let existingSub = await prisma.subject.findFirst({
        where: { userId, name: curSub.name },
      });

      if (!existingSub) {
        existingSub = await prisma.subject.create({
          data: {
            userId,
            name: curSub.name,
            code: curSub.code,
            color: curSub.color,
            icon: curSub.icon,
            targetScore: 90.0,
            syllabusCompletion: 0.0,
          },
        });
        subjectsAdded++;
      }

      // Add chapters & topics if not present
      for (let cIdx = 0; cIdx < curSub.chapters.length; cIdx++) {
        const curChap = curSub.chapters[cIdx];
        let existingChap = await prisma.chapter.findFirst({
          where: { subjectId: existingSub.id, title: curChap.title },
        });

        if (!existingChap) {
          existingChap = await prisma.chapter.create({
            data: {
              subjectId: existingSub.id,
              title: curChap.title,
              orderIndex: cIdx,
            },
          });

          // Add topics
          for (let tIdx = 0; tIdx < curChap.topics.length; tIdx++) {
            const curTopic = curChap.topics[tIdx];
            await prisma.topic.create({
              data: {
                chapterId: existingChap.id,
                title: curTopic.title,
                difficulty: curTopic.difficulty,
                orderIndex: tIdx,
                status: 'NOT_STARTED',
              },
            });
          }
        }
      }

      // Pre-seed flashcards for this subject
      for (const fc of curSub.flashcards) {
        const existingCard = await prisma.flashcard.findFirst({
          where: { userId, question: fc.question },
        });

        if (!existingCard) {
          await prisma.flashcard.create({
            data: {
              userId,
              subjectId: existingSub.id,
              deckTitle: `${curSub.name} - ${fc.deckTitle}`,
              question: fc.question,
              answer: fc.answer,
              keyConcept: fc.keyConcept,
              difficulty: fc.difficulty,
              masteryStatus: 'LEARNING',
            },
          });
          flashcardsAdded++;
        }
      }
    }

    const summary = `Configured for ${gradeClass} (${board}${gradeClass.includes('11') || gradeClass.includes('12') ? ` - ${stream}` : ''}).`;

    return {
      subjectsAdded,
      flashcardsAdded,
      curriculumSummary: summary,
    };
  }
}

export const curriculumService = new CurriculumService();
