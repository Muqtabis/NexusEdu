export declare class AiService {
    chat(userMessage: string, role?: string): Promise<{
        reply: string;
    }>;
}
