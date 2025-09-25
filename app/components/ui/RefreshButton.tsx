'use client'

import { IconRefresh } from "@tabler/icons-react"
import { useGetFeedbackData } from "@/app/hooks/business"
import { Button } from "./Button"
import { useState } from "react"

const RefreshButton = () => {
  const { mutate } = useGetFeedbackData()
  const [isDisabled, setIsDisabled] = useState(false)

  const refreshData = () => {
    setIsDisabled(true)
    mutate()
    setIsDisabled(false)
  }

  return (
    <Button
      type="button"
      variant="default"
      className="fixed rounded-full right-6 bg-primary text-white p-1
      transition duration-300 ease-in-out transform hover:scale-105 z-20"
      disabled={isDisabled}
      onClick={refreshData}
    >
      <IconRefresh size={28}/>
    </Button>
  )
}

export default RefreshButton
