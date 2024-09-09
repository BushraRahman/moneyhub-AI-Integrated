import { Source_Serif_4 } from 'next/font/google';
import dbConnect from '../../../../../lib/mongodb';
import Session from '../../../../models/Session';
import Topic from '../../../../models/Topic';
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

export async function POST(req, { params }) {
  await dbConnect();

  const { session_id } = params;
  const { session, topic_id } = await req.json();

  const existingSession = await Session.findOne({ session_id });

  let trends_data = {}
  if (!existingSession) {
    return new Response(JSON.stringify({ message: 'Session not found' }), { status: 404 });
  }

  const topic = await Topic.findOne({ topic_id });
  if (!topic) {
    return new Response(JSON.stringify({ message: 'Topic not found' }), { status: 404 });
  }

  const userPrompt = "Please summarize the overall trends in students' understanding across each sub-topic. Discuss areas where students have shown significant improvement, areas of struggle, and any general patterns you observe."

  // Dummy function to generate hardcoded insights
  async function generateInsights() {
    processSessionData()
    const systemPrompt2 = `
    act as a financial educator, You are analyzing student performance across multiple sub-topics. Below is the data of students' pre- and post-responses along with if they were correct, the correct answers, and students' names:

    ${JSON.stringify(trends_data)}

    For each student's data in each sub-topic, the progress can be provided as 'wrong', 'consistently correct', 'improved', 'different wrong answer', or 'declined'.
    Use the progress provided for each student in each sub-topic and the average_score in each sub-topic to summarize the overall trends in understanding of each sub-topic, noting sub-topics where understanding has shown improvement,
    sub-topics where understanding is poor, and any general patterns observed. Note especially the sub-topics that need to be taught more.
    Give only overall trends, do not mention individual students.

     Format the output as a JSON that has at least three insights, each insight having the quantitative percentage that the topic or sub-topic was understood by everyone,
     a qualitative, specific observation about students' undertanding of a sub-topic or topic, and the two best study tools to improve understanding in that sub-topic.`
    const openai = new OpenAI();

    const insight = z.object({
      quantitative: z.number(),
      qualitative: z.string(),
      study_tools: z.array(z.string()),
    });

    const InsightGeneration = z.object({
      insights: z.array(insight)
    })

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { role: "system", content: systemPrompt2 },
        { role: "user", content: userPrompt },
      ],
      response_format: zodResponseFormat(InsightGeneration, "insight_generation"),
    });

    let result = completion.choices[0].message.parsed

    return result["insights"]
    console.log(result["insights"])
  }

  const insights = await generateInsights();

  // Save the insights to the session object
  existingSession.insights = insights;
  await existingSession.save();

  function processSessionData(){
    let student_json = existingSession["students"]
    let letters_to_numbers = {"A": 0, "B": 1, "C": 2, "D": 3}
    let topic_data = topic
    for (let i=0; i<4; i++){
      let sub_topic_name = topic_data["sub_topics"][i]
        let sub_topic={}
        let correct_choice = topic_data["quiz"][i].correct_option_id
        sub_topic["correct_answer"] = topic_data["quiz"][i]["options"][letters_to_numbers[correct_choice]]["text"]
        let correct_answer_count=0
        for (var student of student_json){
              let student_arr={}
              if (Object.keys(student["pre_quiz_answers"]).length > 0){
                let selected_option = student["pre_quiz_answers"][i]["selected_option_id"]
                  student_arr["pre_response"] = topic["quiz"][i]["options"][letters_to_numbers[selected_option]]["text"]
                  if (Object.keys(student["post_quiz_answers"]).length > 0){
                      selected_option = student["post_quiz_answers"][i]["selected_option_id"]
                      student_arr["post_response"] = topic["quiz"][i]["options"][letters_to_numbers[selected_option]]["text"]
                      if (student_arr["pre_response"] == student_arr["post_response"] & student_arr["pre_response"] == sub_topic["correct_answer"]){
                          student_arr["progress"]="consistently correct"}
                      else if (student_arr["pre_response"] == student_arr["post_response"] & student_arr["pre_response"] != sub_topic["correct_answer"]){
                        student_arr["progress"]="wrong"}
                      else if (student_arr["pre_response"] != sub_topic["correct_answer"] & student_arr["post_response"] == sub_topic["correct_answer"]){
                          student_arr["progress"]="improved"}
                      else if(student_arr["pre_response"] != sub_topic["correct_answer"] & student_arr["post_response"] != sub_topic["correct_answer"]){
                          student_arr["progress"]="different wrong answer"}
                      else{
                          student_arr["progress"]="declined"
                  }
                }
                  else{
                      student_arr["progress"]="N/A"
                  }
          }
              if (student_arr["post_response"] === sub_topic["correct_answer"]){
                correct_answer_count+=1
              }
              // add the student dictionary to the sub-topic's dictionary
              sub_topic[student['name']] = student_arr
          }
          sub_topic["average_score"] = correct_answer_count/(Object.keys(sub_topic).length-1)
          // add the completed dictionary for a sub-topic to the actual dict
          trends_data[sub_topic_name] = sub_topic
      }
  }
  return new Response(JSON.stringify({ message: 'Insights generated', insights}), { status: 200 });
}