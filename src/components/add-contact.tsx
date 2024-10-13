'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { it } from 'date-fns/locale';

import { Button } from "@/components/ui/button"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function AddContactPage() {

  type Contact = {
    name: string;
    phone: string;
    email: string;
    nextCallDate: string; // or Date if you parse it correctly
    timesCalled: number; // Assuming this is stored as a number
  };

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [nextCallDate, setNextCallDate] = useState<Date | undefined>(undefined)
  const [timesCalled, setTimesCalled] = useState("0")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [existingContact, setExistingContact] = useState<Contact | null>(null);
  const [overwrite, setOverwrite] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters."
    }
    if (phone.length < 10) {
      newErrors.phone = "Phone number must be at least 10 digits."
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Please enter a valid email address."
    }
    if (!nextCallDate) {
      newErrors.nextCallDate = "Please select a date for the next call."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkExistingContact = async () => {
    const response = await fetch(`/api/contacts?name=${name}`);
    if (response.status === 409) {
      const data = await response.json();
      setExistingContact(data.contact);
      setOverwrite(true);
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const isExisting = await checkExistingContact();
    if (isExisting && !overwrite) return; // Fermiamo solo se non c'è sovrascrittura

    setIsLoading(true);
    
    const formattedDate = nextCallDate ? format(nextCallDate, 'yyyy-MM-dd') : undefined;
    
    const payload = {
      name,
      phone,
      email,
      nextCallDate: formattedDate,
      timesCalled,
      overwrite,
    };

    console.log(payload.name);
    console.log(payload.email);
    console.log(payload.timesCalled);
    console.log(payload.nextCallDate);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save contact");
      }

      toast({
        title: "Success",
        description: "Contact added successfully!",
      });

      console.log(payload.name);
      console.log(payload.email);
      console.log(payload.timesCalled);
      console.log(payload.nextCallDate);

      setName("");
      setPhone("");
      setEmail("");
      setNextCallDate(undefined);
      setTimesCalled("0");
      setOverwrite(false);
      setExistingContact(null);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save contact. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="container mx-auto p-4 mt-4">

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-8 mb-6 items-center justify-center ">
          <div className="w-full md:w-1/2 space-y-6">
          <h1 className="text-2xl font-bold mb-6">Aggiungi Nuovo Contatto</h1>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome:</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setExistingContact(null);
                }}
                placeholder=""
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefono:</label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder=""
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="timesCalled" className="block text-sm font-medium text-gray-700">Numero Chiamate già effettuate:</label>
              <Select value={timesCalled} onValueChange={setTimesCalled}>
                <SelectTrigger>
                  <SelectValue placeholder="Select times called" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">Prossima Chiamata:</h2>
            <CustomCalendar
              selected={nextCallDate}
              onSelect={setNextCallDate}
            />
            {errors.nextCallDate && <p className="mt-1 text-sm text-red-600 ">{errors.nextCallDate}</p>}
            {nextCallDate && (
              <p className="mt-2 text-sm text-muted-foreground text-lg">
                Data Selezionata: {format(nextCallDate, 'dd-MM-yyyy', { locale: it })}
              </p>
            )}
          </div>
        </div>
        {existingContact && (
                  <div className="w-full p-4 mt-4">
                  <div className="bg-white rounded-lg shadow-md p-6 w-full">
                    <h2 className="text-xl font-semibold mb-4">Contatto già esistente:</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="flex flex-col p-4 border rounded-lg border-gray-300">
                        <label className="text-sm font-medium text-gray-700">Nome:</label>
                        <p className="mt-1 text-lg">{existingContact.name}</p>
                      </div>
                      <div className="flex flex-col p-4 border rounded-lg border-gray-300">
                        <label className="text-sm font-medium text-gray-700">Telefono:</label>
                        <p className="mt-1 text-lg">{existingContact.phone}</p>
                      </div>
                      <div className="flex flex-col p-4 border rounded-lg border-gray-300">
                        <label className="text-sm font-medium text-gray-700">Email:</label>
                        <p className="mt-1 text-lg">{existingContact.email}</p>
                      </div>
                      <div className="flex flex-col p-4 border rounded-lg border-gray-300">
                        <label className="text-sm font-medium text-gray-700">Prossima Chiamata:</label>
                        <p className="mt-1 text-lg">{existingContact.nextCallDate ? format(new Date(existingContact.nextCallDate), 'dd-MM-yyyy') : 'Nessuna data disponibile'}</p>
                      </div>
                      <div className="flex flex-col p-4 border rounded-lg border-gray-300">
                        <label className="text-sm font-medium text-gray-700">Numero Chiamate già effettuate:</label>
                        <p className="mt-1 text-lg">{existingContact.timesCalled}</p>
                      </div>
                    </div>
                  </div>
                </div>
        )}


        <div className="flex justify-center mt-8">
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingContact ? "Sovrascrivi Contatto" : "Salva Contatto"}
          </Button>
        </div>
      </form>
    </div>
  )
}
