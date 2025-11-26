import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// Export the FormProvider directly for convenience
export const Form = FormProvider;

// Context to hold the field name for a given FormField
type FormFieldContextValue<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
    name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

// FormField component wraps react-hook-form Controller and provides the field name via context
function FormField<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
    ...props
}: ControllerProps<TFieldValues, TName>) {
    return (
        <FormFieldContext.Provider value={{ name: props.name }}>
            <Controller {...props} />
        </FormFieldContext.Provider>
    );
}

// Context for a form item (used to generate unique ids for accessibility)
type FormItemContextValue = {
    id: string;
};

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
    const id = React.useId();
    return (
        <FormItemContext.Provider value={{ id }}>
            <div data-slot="form-item" className={cn("space-y-2", className)} {...props} />
        </FormItemContext.Provider>
    );
}

// Hook to retrieve field state and ids, with proper null checks
function useFormField() {
    const fieldContext = React.useContext(FormFieldContext);
    if (!fieldContext) {
        throw new Error("useFormField should be used within <FormField>");
    }

    const itemContext = React.useContext(FormItemContext);
    if (!itemContext) {
        throw new Error("useFormField should be used within <FormItem>");
    }

    const { getFieldState, formState } = useFormContext();
    const fieldState = getFieldState(fieldContext.name, formState);

    const { id } = itemContext;
    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState,
    };
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
    const { error, formItemId } = useFormField();
    return (
        <Label
            data-slot="form-label"
            className={cn(error && "text-destructive", className)}
            htmlFor={formItemId}
            {...props}
        />
    );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
    return (
        <Slot
            data-slot="form-control"
            id={formItemId}
            aria-describedby={
                !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`
            }
            aria-invalid={!!error}
            {...props}
        />
    );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
    const { formDescriptionId } = useFormField();
    return (
        <p
            data-slot="form-description"
            id={formDescriptionId}
            className={cn("text-muted-foreground text-[0.8rem]", className)}
            {...props}
        />
    );
}

function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message) : children;
    if (!body) return null;
    return (
        <p
            data-slot="form-message"
            id={formMessageId}
            className={cn("text-destructive text-[0.8rem] font-medium", className)}
            {...props}
        >
            {body}
        </p>
    );
}

export {
    useFormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    FormField,
};
