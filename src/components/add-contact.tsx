'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { it } from 'date-fns/locale';

import { Button } from "@/components/ui/button"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { Input } from "@/components/ui/input"
import {TextEditor} from '@/components/ui/text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { debug } from "console"


export default function AddContactPage() {

  function transformString(input: string): string {
    // Regular expression to match HTML tags and text nodes
    const parts = input.split(/(<[^>]+>)/).filter(Boolean); // Split by HTML tags
  
    // Transform the parts
    const transformedParts = parts.map(part => {
      // If the part is an HTML tag, replace <div> with a line break
      if (part.startsWith('<') && part.endsWith('>')) {
        return part === '<div>' ? '<br />' : part; // Replace <div> with <br />
      }
      // Return plain text as is (no quotes)
      return part.trim();
    });
  
    // Join the parts back together
    return transformedParts.join('');
  }

  type Contact = {
    name: string;
    phone: string;
    email: string;
    nextCallDate: string; // or Date if you parse it correctly
    timesCalled: number; // Assuming this is stored as a number
    description: string;
  };

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [nextCallDate, setNextCallDate] = useState<Date | undefined>(undefined)
  const [newDateChosen, setNewDateChosen] = useState(true)
  const [timesCalled, setTimesCalled] = useState("0")
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [existingContact, setExistingContact] = useState<Contact | null>(null);
  const [overwrite, setOverwrite] = useState(false)
  const [existingContacts, setExistingContacts] = useState<Contact[]>([]);

  const router = useRouter()
  const { toast } = useToast()
  
  const fetchContacts = async () => {
    try {
      const formattedDate = nextCallDate ? format(nextCallDate, 'yyyy-MM-dd') : undefined;
      const response = await fetch(`/api/day-contacts?date=${formattedDate}`);
      
      const data = await response.json();
      console.log(formattedDate);
      // Ensure the data is an array and not undefined/null
      if (Array.isArray(data)) {
        setExistingContacts(data);
      } else {
        setExistingContacts([]); // Set empty array if data is not an array
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setExistingContacts([]); // Set empty array in case of error
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (name.length < 2) {
      newErrors.name = "Il nome dev'essere di almeno 2 lettere."
    }
    if (phone.length < 9) {
      newErrors.phone = "Il numero di telefono dev'essere di almeno 9 numeri."
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "inserisci una email valida."
    }
    if (!nextCallDate) {
      newErrors.nextCallDate = "Seleziona una data."
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
    setIsLoading(true);
    if (!validateForm()){
      setIsLoading(false);
      return;
    } 

    const isExisting = await checkExistingContact();
    if (isExisting && !overwrite){
      setIsLoading(false);
      return;
    } 
    
    const formattedDate = nextCallDate ? format(nextCallDate, 'yyyy-MM-dd') : undefined;
    
    const payload = {
      name,
      phone,
      email,
      nextCallDate: formattedDate,
      timesCalled,
      overwrite,
      description
    };
    console.log(description);

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

      setName("");
      setPhone("");
      setEmail("");
      setDescription("");
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
            <label className="block mb-2 text-sm font-medium text-gray-700">Descrizione</label>
            <TextEditor value={description} onChange={setDescription}/>
          </div>
          <div className="w-full md:w-1/2 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6">Prossima Chiamata:</h2>
            <CustomCalendar
              selected={nextCallDate}
              onSelect={setNextCallDate}
              onChange={setNewDateChosen}
            />
            {errors.nextCallDate && <p className="mt-1 text-sm text-red-600 ">{errors.nextCallDate}</p>}
            {nextCallDate && (
              <p className="mt-2 text-muted-foreground text-lg text-2xl mb-6">
                Data Selezionata: {format(nextCallDate, 'dd-MM-yyyy', { locale: it })}
              </p>
            )}
        {nextCallDate &&   <div
    onClick={!(!nextCallDate || isLoading) ? () => { fetchContacts(); setNewDateChosen(false); } : undefined}
    className={`ml-4 bg-black text-white p-2 rounded-lg cursor-pointer w-auto text-center ${(!nextCallDate || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
    style={{ pointerEvents: (!nextCallDate || isLoading) ? 'none' : 'auto' }}
  >
        {isLoading ? "Caricamento..." : "Guarda contatti in quella data"}
      </div>}
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
                  <div className="flex flex-col p-4 border rounded-lg border-gray-300">
                    <label className="text-sm font-medium text-gray-700">Descrizione:</label>
                    <p className="mt-1 text-lg" dangerouslySetInnerHTML={{ __html: transformString(existingContact.description) }} />
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
        {((existingContacts.length > 0) && nextCallDate && !newDateChosen)? (
  <div className="bg-white rounded-lg shadow-md p-6 w-full mb-6">
    <h2 className="text-xl font-semibold mb-4">Contatti da chiamare nel {nextCallDate
              ? format(new Date(nextCallDate), "dd-MM-yyyy")
              : "Nessuna data disponibile"}</h2>
    {existingContacts.map((existingContact, index) => (
      <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-10" key={index}>
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
          <label className="text-sm font-medium text-gray-700">Numero Chiamate già effettuate:</label>
          <p className="mt-1 text-lg">{existingContact.timesCalled}</p>
        </div>
      </div>
              <div className="flex flex-col p-4 border rounded-lg border-gray-300">
              <label className="text-sm font-medium text-gray-700">Descrizione:</label>
              <p className="mt-1 text-lg" dangerouslySetInnerHTML={{ __html: transformString(existingContact.description) }}></p>
            </div>
            </div>
    ))}
  </div>
) : (
  <p></p>
)}
      
    </div>
  )
}
