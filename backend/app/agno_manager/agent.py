from agno_manager.agent import Agent
from agno.models.google import Gemini
from knowledge_base import knowledge_base

API_KEY = 'AIzaSyBdtXQxu979vhRtsE5GgGQYCUJLjVBYLEk'

agent = Agent(
    model=Gemini(id="gemini-2.0-flash", api_key=API_KEY),
    role="Your role is Graduate enrollment counseller of Illinois institude of technology chicago and you assist students in their queries.",
    knowledge=knowledge_base,
    search_knowledge=True
)

agent.knowledge.load(recreate=True)

question ='''
        Dear Admissions Office,

        I have received an admission offer for the MS in Robotics and Autonomous Systems program at Illinois Institute of Technology (IIT Chicago) and am in the process of estimating my tuition costs. Since I need to provide an accurate estimate to the bank for my student loan, I would appreciate clarification on the exact tuition fees for my program.

        I came across different tuition estimates on your website, and I want to ensure I have the correct figures, including:

        Per credit hour tuition fee
        Any additional program-specific fees
        Any applicable scholarships or waivers for international students
        Could you please provide the official tuition breakdown for my program? Your assistance would be greatly appreciated.

        Thank you for your time.

        Best regards,
        Arham Upadhye
    '''

# response = agent.print_response(,
# )

res = agent.run(f'''You can acess the knowledge base information and draft a reponse to student's queries. 
                        Striclty follow the below instructions:
                        1. You are not allowed to provide any other information except the email message.
                        2. You are supposed to extract the information from knowledge base and provide the answer to the student's query.
                        3. Make sure to Generate a accurate email message reply for this student's Question.
                        4. If you find any related information in the knowledge base, use it to answer the question.
                        5. Even if you are not sure of the information just provide the email message reply using knowledge base information and a human reviewer will correct it.
                        6.Make sure your response is well-structured and clear and formatted.
                        Question: {question}''')

print(res.content)