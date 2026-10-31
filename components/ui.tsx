'use client';
import * as Dialog from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import {clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';
export const cn=(...v:Parameters<typeof clsx>)=>twMerge(clsx(v));
export function Button({className,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>){return <button className={cn('button',className)} {...props}/>}
export function Modal({open,onClose,title,description,children}:{open:boolean,onClose:()=>void,title:string,description?:string,children:React.ReactNode}){return <Dialog.Root open={open} onOpenChange={v=>!v&&onClose()}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className="modal"><div className="modal-head"><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description||'Manage your Brightloop workspace.'}</Dialog.Description></div><Dialog.Close asChild><button className="icon-button" aria-label="Close dialog"><X size={20}/></button></Dialog.Close></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>}
export function Badge({status}:{status:string}){return <span className={`badge badge-${status.toLowerCase().replaceAll(' ','-')}`}><i/>{status}</span>}
