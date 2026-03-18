exports.handler = async function(event, context) {
  if(event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if(event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { studentName, context: studentContext } = JSON.parse(event.body);

    const prompt = 'You are InnerMap, a private self-discovery companion for Indian students aged 13-18.\n\n'
      + 'A student named ' + studentName + ' completed their Week 1 self-discovery quizzes. Here are their answers:\n\n'
      + studentContext
      + '\n\nBased on these specific answers, generate exactly 5 personalised follow-up questions for their Week 2 check-in.\n\n'
      + 'Rules:\n'
      + '- Each question must reference something specific from their Week 1 answers\n'
      + '- Questions should be warm, conversational, non-judgmental\n'
      + '- No pressure, no right or wrong answers\n'
      + '- Help them go deeper into what they discovered about themselves\n'
      + '- Questions should be open-ended (not multiple choice)\n'
      + '- Keep each question under 20 words\n'
      + '- Speak directly to them like a caring friend\n\n'
      + 'Return ONLY a JSON array of 5 strings. No other text. Example:\n'
      + '["Question 1?","Question 2?","Question 3?","Question 4?","Question 5?"]';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if(!response.ok) {
      throw new Error(data.error?.message || 'API error');
    }

    const text = data.content && data.content[0] && data.content[0].text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(clean);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ questions })
    };

  } catch(err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

