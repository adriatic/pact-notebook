export class Moderator {

    checkPrompt(prompt: string): { status: string } {

        if (prompt.toLowerCase().includes("ignore previous instructions")) {
            return { status: "BLOCK" };
        }

        return { status: "PASS" };
    }

}