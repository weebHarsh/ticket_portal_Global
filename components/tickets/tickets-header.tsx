"use client"

export default function TicketsHeader() {
  return (
    <div className="bg-card dark:bg-gray-800 p-4 shadow-lg rounded-md border border-border">
      <h1 className="text-3xl font-poppins font-bold text-foreground">My Tickets</h1>
      <p className="text-foreground-secondary mt-1">View and manage all your tickets</p>
    </div>
  )
}
