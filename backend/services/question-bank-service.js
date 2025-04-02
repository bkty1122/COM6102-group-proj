// services/question-bank-service.js
class QuestionBankService {
    constructor(dbService) {
      this.dbService = dbService;
    }
  
    async getFirstPageForBank(questionbankId) {
      try {
        return await this.dbService.get(
          `SELECT * FROM question_bank_pages 
           WHERE questionbank_id = ? 
           ORDER BY page_index ASC 
           LIMIT 1`,
          [questionbankId]
        );
      } catch (error) {
        console.error('Error getting first page for bank:', error);
        throw error;
      }
    }
    
    async getQuestionCountForBank(questionbankId) {
      try {
        // More accurate question count query using cards table
        const result = await this.dbService.get(
          `SELECT COUNT(*) as count FROM cards c
           JOIN question_bank_pages p ON c.page_id = p.id
           WHERE p.questionbank_id = ? AND c.card_type = 'question'`,
          [questionbankId]
        );
        
        return result ? result.count : 0;
      } catch (error) {
        console.error('Error counting questions for bank:', error);
        return 0;
      }
    }
  
    // Optimized method to retrieve question bank by ID
    async getQuestionBankById(questionbankId, contentRetriever) {
      try {
        // Get the main question bank record
        const questionBank = await this.dbService.get(
          'SELECT * FROM question_banks WHERE questionbank_id = ?',
          [questionbankId]
        );
        
        if (!questionBank) {
          return null;
        }
        
        // Get all pages for this question bank with all metadata
        const pages = await this.dbService.all(
          `SELECT id, page_index, exam_language, exam_type, component, category, 
           created_at, updated_at 
           FROM question_bank_pages 
           WHERE questionbank_id = ? 
           ORDER BY page_index`,
          [questionbankId]
        );
        
        // Process all pages in parallel for better performance
        const processedPages = await Promise.all(
          pages.map(async (page) => {
            // Get cards for this page
            const cards = await this.dbService.all(
              'SELECT id, card_type, position FROM cards WHERE page_id = ? ORDER BY position',
              [page.id]
            );
            
            // Process all cards in parallel
            const processedCards = await Promise.all(
              cards.map(async (card) => {
                const contents = await contentRetriever.getCardContents(card.id, card.card_type);
                
                return {
                  card_type: card.card_type,
                  position: card.position,
                  contents
                };
              })
            );
            
            return {
              page_index: page.page_index,
              exam_categories: {
                exam_language: page.exam_language,
                exam_type: page.exam_type,
                component: page.component,
                category: page.category
              },
              exam_language: page.exam_language,
              cards: processedCards
            };
          })
        );
        
        // Build the complete response with additional metadata
        return {
          title: questionBank.title,
          description: questionBank.description,
          exportDate: questionBank.export_date,
          questionbank_id: questionBank.questionbank_id,
          status: questionBank.status,
          created_at: questionBank.created_at,
          updated_at: questionBank.updated_at,
          version: questionBank.version,
          pages: processedPages
        };
      } catch (error) {
        console.error("Error getting question bank:", error);
        throw error;
      }
    }
  }
  
  module.exports = QuestionBankService;