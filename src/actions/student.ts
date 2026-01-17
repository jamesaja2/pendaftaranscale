'use server';

import axios from 'axios';

const API_URL = "https://cadangan.stlouislc.net/hadir/buatqr/search.php";
const API_KEY = "b1290a4f2d8e40f1a6c9e91a7123a5e6";

export interface StudentResult {
    nis: string;
    name: string;
    class: string;
    absen: string;
}

interface ApiStudent {
    no: string;
    nama: string;
    kelas: string;
}

export async function searchStudents(query: string): Promise<StudentResult[]> {
    if (!query || query.length < 3) return [];

    try {
        const response = await axios.get(`${API_URL}?name=${encodeURIComponent(query)}`, {
            headers: {
                'x-api-key': API_KEY
            }
        });
        
        const data = response.data;
        if (Array.isArray(data)) {
            return data.map((item: ApiStudent) => {
                const parts = (item.kelas || "").split('/');
                const realClass = parts[0] ? parts[0].trim() : (item.kelas || "");
                const absen = parts[1] ? parts[1].trim() : "";
                
                return {
                    nis: item.no,
                    name: item.nama,
                    class: realClass,
                    absen: absen
                };
            });
        }
        return [];
    } catch (error) {
        console.error("Student Search API Error:", error);
        return [];
    }
}

export async function getStudentByNis(nis: string): Promise<StudentResult | null> {
    if (!nis) return null;
    try {
        const response = await axios.get(`${API_URL}?name=${encodeURIComponent(nis)}`, {
            headers: { 'x-api-key': API_KEY }
        });

        const data = response.data;
        if (Array.isArray(data)) {
            const found = data.find((s: ApiStudent) => s.no === nis);
            if (found) {
                const parts = (found.kelas || "").split('/');
                const realClass = parts[0] ? parts[0].trim() : (found.kelas || "");
                const absen = parts[1] ? parts[1].trim() : "";

                 return {
                    nis: found.no,
                    name: found.nama,
                    class: realClass,
                    absen: absen
                };
            }
        }
        return null; // Not found
    } catch (error) {
        console.error("getStudentByNis API Error:", error);
        return null;
    }
}
