"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { VibeCard } from "@/components/vibe-card"
import { currentUser } from "@/lib/sample-data"
import { Badge } from "@/components/ui/badge"
import { X, Upload } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreateVibe() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Preview vibe
  const previewVibe = {
    id: "preview",
    title: title || "your vibe title",
    description: description || "describe your vibe here...",
    image: image,
    createdBy: currentUser,
    createdAt: new Date().toISOString(),
    ratings: [],
    tags: tags,
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput("")
    }
  }

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      alert("please provide both a title and description for your vibe.")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      // In a real app, we would save to the backend here
      alert("vibe created successfully!")
      router.push("/")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 lowercase">create a new vibe</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="lowercase">
                        title
                      </Label>
                      <Input
                        id="title"
                        placeholder="name your vibe"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="lowercase">
                        description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="describe the vibe in detail..."
                        className="min-h-32"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image" className="lowercase">
                        image (optional)
                      </Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        {image ? (
                          <div className="space-y-4">
                            <div className="relative aspect-video mx-auto overflow-hidden rounded-md">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={image || "/placeholder.svg"}
                                alt="Preview"
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setImage(null)}
                              className="lowercase"
                            >
                              remove image
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex justify-center">
                              <Upload className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium lowercase">
                                drag and drop an image, or click to browse
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 lowercase">
                                recommended: 1200×600px or higher, 16:9 ratio
                              </p>
                            </div>
                            <Input
                              id="image"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById("image")?.click()}
                              className="lowercase"
                            >
                              choose file
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags" className="lowercase">
                        tags (optional)
                      </Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1 lowercase">
                            {tag.toLowerCase()}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="h-4 w-4 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center"
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">remove {tag} tag</span>
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        id="tags"
                        placeholder="add tags (press enter after each tag)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                      />
                      <p className="text-xs text-muted-foreground lowercase">
                        examples: embarrassing, nostalgic, awkward, satisfying
                      </p>
                    </div>

                    <Button type="submit" className="w-full lowercase" disabled={isSubmitting}>
                      {isSubmitting ? "creating..." : "create vibe"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold lowercase">preview</h2>
            <VibeCard vibe={previewVibe} preview />
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2 lowercase">tips for a great vibe:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground lowercase">
                <li>be specific and descriptive</li>
                <li>use relatable language</li>
                <li>add an image that captures the feeling</li>
                <li>include relevant tags to help others find your vibe</li>
                <li>keep it appropriate for all audiences</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
