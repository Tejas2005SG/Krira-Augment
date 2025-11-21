import * as React from "react"
import { Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type CreateChatbotStepProps = {
  chatbotNameInput: string
  setChatbotNameInput: (value: string) => void
  handleCreateChatbot: () => void
  isCreatingChatbot: boolean
}

export function CreateChatbotStep({
  chatbotNameInput,
  setChatbotNameInput,
  handleCreateChatbot,
  isCreatingChatbot,
}: CreateChatbotStepProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-10">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Name your Chatbot</h2>
        <p className="text-muted-foreground">
          Give your AI assistant a unique identity to get started.
        </p>
      </div>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chatbot-name">Chatbot Name</Label>
              <Input
                id="chatbot-name"
                placeholder="e.g. Support Assistant, Sales Bot..."
                value={chatbotNameInput}
                onChange={(e) => setChatbotNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreatingChatbot) {
                    handleCreateChatbot()
                  }
                }}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleCreateChatbot} 
              disabled={isCreatingChatbot || !chatbotNameInput.trim()}
            >
              {isCreatingChatbot ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create & Continue"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
