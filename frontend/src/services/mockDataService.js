// src/services/mockDataService.js
// Mock data service - to be replaced with actual API calls

export const MOCK_MATERIALS = [
  {
    id: 'qb-123456',
    title: 'Reading Comprehension - Beginner',
    exam_language: 'English',
    exam_type: 'IELTS',
    component: 'Reading',
    created_by: 'john.doe',
    created_at: '2025-02-15T09:30:00',
    updated_by: 'jane.smith',
    updated_at: '2025-03-12T14:45:00',
    question_count: 8,
    status: 'published'
  },
  {
    id: 'qb-123457',
    title: 'Grammar Assessment',
    exam_language: 'English',
    exam_type: 'IELTS',
    component: 'Writing',
    created_by: 'jane.smith',
    created_at: '2025-02-20T11:15:00',
    updated_by: 'jane.smith',
    updated_at: '2025-03-01T16:30:00',
    question_count: 15,
    status: 'draft'
  },
  {
    id: 'qb-123458',
    title: 'Vocabulary Test',
    exam_language: 'Spanish',
    exam_type: 'DELE',
    component: 'Reading',
    created_by: 'john.doe',
    created_at: '2025-02-10T14:00:00',
    updated_by: 'john.doe',
    updated_at: '2025-02-28T09:45:00',
    question_count: 20,
    status: 'published'
  },
  {
    id: 'qb-123459',
    title: 'Listening Exercise',
    exam_language: 'French',
    exam_type: 'TCF',
    component: 'Listening',
    created_by: 'alex.johnson',
    created_at: '2025-02-25T10:20:00',
    updated_by: 'jane.smith',
    updated_at: '2025-03-10T11:30:00',
    question_count: 12,
    status: 'published'
  },
  {
    id: 'qb-123460',
    title: 'Writing Prompt',
    exam_language: 'German',
    exam_type: 'TestDaF',
    component: 'Writing',
    created_by: 'jane.smith',
    created_at: '2025-03-05T09:00:00',
    updated_by: 'alex.johnson',
    updated_at: '2025-03-15T13:20:00',
    question_count: 5,
    status: 'draft'
  },
  {
    id: 'qb-123461',
    title: 'Oral Examination',
    exam_language: 'Japanese',
    exam_type: 'JLPT',
    component: 'Speaking',
    created_by: 'alex.johnson',
    created_at: '2025-03-01T15:45:00',
    updated_by: 'alex.johnson',
    updated_at: '2025-03-18T10:10:00',
    question_count: 10,
    status: 'published'
  },
  {
    id: 'qb-123462',
    title: 'Reading Comprehension',
    exam_language: 'Chinese',
    exam_type: 'HSK',
    component: 'Reading',
    created_by: 'john.doe',
    created_at: '2025-02-12T11:30:00',
    updated_by: 'john.doe',
    updated_at: '2025-03-05T09:15:00',
    question_count: 15,
    status: 'draft'
  },
  {
    id: 'qb-123463',
    title: 'Grammar Quiz',
    exam_language: 'English',
    exam_type: 'TOEFL',
    component: 'Writing',
    created_by: 'jane.smith',
    created_at: '2025-02-18T13:40:00',
    updated_by: 'alex.johnson',
    updated_at: '2025-03-08T14:25:00',
    question_count: 25,
    status: 'published'
  }
];

// Get filter options from materials
export const getFilterOptions = (materials) => {
  const uniqueLanguages = [...new Set(materials.map(item => item.exam_language))];
  const uniqueExamTypes = [...new Set(materials.map(item => item.exam_type))];
  const uniqueComponents = [...new Set(materials.map(item => item.component))];
  
  return {
    uniqueLanguages,
    uniqueExamTypes,
    uniqueComponents
  };
};

// Get categorized materials by language and exam type
export const getCategorizedMaterials = (materials) => {
  const materialsByLanguage = {};
  
  materials.forEach(material => {
    if (!materialsByLanguage[material.exam_language]) {
      materialsByLanguage[material.exam_language] = {};
    }
    
    if (!materialsByLanguage[material.exam_language][material.exam_type]) {
      materialsByLanguage[material.exam_language][material.exam_type] = [];
    }
    
    materialsByLanguage[material.exam_language][material.exam_type].push(material);
  });
  
  return materialsByLanguage;
};

// Get dashboard statistics
export const getDashboardStats = (materials) => {
  const uniqueLanguages = [...new Set(materials.map(item => item.exam_language))];
  const uniqueExamTypes = [...new Set(materials.map(item => item.exam_type))];
  const uniqueComponents = [...new Set(materials.map(item => item.component))];
  
  return {
    totalMaterials: materials.length,
    published: materials.filter(m => m.status === 'published').length,
    drafts: materials.filter(m => m.status === 'draft').length,
    languages: uniqueLanguages.length,
    examTypes: uniqueExamTypes.length,
    components: uniqueComponents.length
  };
};